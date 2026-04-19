/**
 * ============================================================
 *  Stellar Soroban Contract Service
 *  Bridges the off-chain Network Health Monitor with the
 *  on-chain Soroban smart contract for persistent storage.
 * ============================================================
 */

import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

// ─── Status Mapping ──────────────────────────────────────────
const STATUS_MAP = {
  0: 'healthy',
  1: 'moderate',
  2: 'congested',
};

const SEVERITY_MAP = {
  0: 'info',
  1: 'warning',
  2: 'danger',
};

// ─── Contract Service Class ──────────────────────────────────
export class ContractService {
  /**
   * @param {Object} config
   * @param {string} config.contractId     - Deployed Soroban contract ID
   * @param {string} config.rpcUrl         - Soroban RPC endpoint
   * @param {string} config.networkPassphrase - Network passphrase
   * @param {string} config.secretKey      - Reporter/admin secret key
   */
  constructor(config = {}) {
    this.contractId = config.contractId || process.env.CONTRACT_ID || '';
    this.rpcUrl = config.rpcUrl || process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.networkPassphrase = config.networkPassphrase || process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
    this.secretKey = config.secretKey || process.env.REPORTER_SECRET_KEY || '';

    this.server = null;
    this.contract = null;
    this.keypair = null;
    this.publicKey = null;
    this.initialized = false;
  }

  // ────────────── Initialization ──────────────

  /**
   * Initialize the contract service — connect to RPC and validate config
   */
  async init() {
    if (!this.contractId) {
      console.warn('[ContractService] No CONTRACT_ID configured — on-chain features disabled');
      return false;
    }

    if (!this.secretKey) {
      console.warn('[ContractService] No REPORTER_SECRET_KEY configured — read-only mode');
    }

    try {
      this.server = new SorobanRpc.Server(this.rpcUrl, { allowHttp: true });
      this.contract = new Contract(this.contractId);

      if (this.secretKey) {
        this.keypair = Keypair.fromSecret(this.secretKey);
        this.publicKey = this.keypair.publicKey();
      }

      // Validate connection by checking the server health
      const health = await this.server.getHealth();
      if (health.status === 'healthy') {
        console.log(`[ContractService] Connected to Soroban RPC (${this.rpcUrl})`);
        console.log(`[ContractService] Contract: ${this.contractId}`);
        this.initialized = true;
        return true;
      }
    } catch (err) {
      console.error(`[ContractService] Initialization failed: ${err.message}`);
    }

    return false;
  }

  /**
   * Check if the service is ready for write operations
   */
  isWriteReady() {
    return this.initialized && !!this.keypair;
  }

  /**
   * Check if the service is ready for read operations
   */
  isReadReady() {
    return this.initialized;
  }

  // ────────────── Write Operations ──────────────

  /**
   * Submit a health snapshot to the on-chain contract
   * @param {Object} metrics - Metrics from MetricsEngine
   * @returns {Object|null} Transaction result or null on failure
   */
  async submitSnapshot(metrics) {
    if (!this.isWriteReady()) {
      console.warn('[ContractService] Not ready for writes — skipping snapshot submission');
      return null;
    }

    try {
      const {
        ledgerSequence,
        tps = 0,
        baseFeeStroops = 100,
        closeTime = 5,
        feeStats = {},
        txCount = 0,
        opCount = 0,
      } = metrics;

      const tpsX100 = Math.round(tps * 100);
      const closeTimeMs = Math.round((closeTime || 5) * 1000);
      const p90Fee = parseInt(feeStats?.p90Fee || '100');

      const operation = this.contract.call(
        'submit_snapshot',
        new Address(this.publicKey).toScVal(),          // reporter
        nativeToScVal(ledgerSequence, { type: 'u64' }), // ledger_seq
        nativeToScVal(tpsX100, { type: 'u32' }),        // tps_x100
        nativeToScVal(baseFeeStroops, { type: 'u32' }), // base_fee_stroops
        nativeToScVal(closeTimeMs, { type: 'u32' }),    // close_time_ms
        nativeToScVal(p90Fee, { type: 'u32' }),         // p90_fee_stroops
        nativeToScVal(txCount, { type: 'u32' }),        // tx_count
        nativeToScVal(opCount, { type: 'u32' }),        // op_count
      );

      const result = await this._submitTransaction(operation);
      console.log(`[ContractService] Snapshot submitted for ledger #${ledgerSequence}`);
      return result;
    } catch (err) {
      console.error(`[ContractService] submitSnapshot failed: ${err.message}`);
      return null;
    }
  }

  // ────────────── Read Operations ──────────────

  /**
   * Get the latest health snapshot from the contract
   * @returns {Object|null} Parsed snapshot
   */
  async getLatestSnapshot() {
    if (!this.isReadReady()) return null;

    try {
      const result = await this._simulateCall('get_latest_snapshot');
      return this._parseSnapshot(result);
    } catch (err) {
      console.error(`[ContractService] getLatestSnapshot failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get a snapshot by ledger sequence number
   * @param {number} ledgerSeq
   * @returns {Object|null}
   */
  async getSnapshotByLedger(ledgerSeq) {
    if (!this.isReadReady()) return null;

    try {
      const result = await this._simulateCall(
        'get_snapshot',
        nativeToScVal(ledgerSeq, { type: 'u64' }),
      );
      return this._parseSnapshot(result);
    } catch (err) {
      console.error(`[ContractService] getSnapshotByLedger failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get total snapshot count
   * @returns {number}
   */
  async getSnapshotCount() {
    if (!this.isReadReady()) return 0;

    try {
      const result = await this._simulateCall('get_snapshot_count');
      return scValToNative(result);
    } catch (err) {
      console.error(`[ContractService] getSnapshotCount failed: ${err.message}`);
      return 0;
    }
  }

  /**
   * Get all on-chain alerts
   * @returns {Array}
   */
  async getAlerts() {
    if (!this.isReadReady()) return [];

    try {
      const result = await this._simulateCall('get_alerts');
      return this._parseAlerts(result);
    } catch (err) {
      console.error(`[ContractService] getAlerts failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Get the current health configuration
   * @returns {Object|null}
   */
  async getConfig() {
    if (!this.isReadReady()) return null;

    try {
      const result = await this._simulateCall('get_config');
      return scValToNative(result);
    } catch (err) {
      console.error(`[ContractService] getConfig failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get admin address
   * @returns {string|null}
   */
  async getAdmin() {
    if (!this.isReadReady()) return null;

    try {
      const result = await this._simulateCall('get_admin');
      return scValToNative(result);
    } catch (err) {
      console.error(`[ContractService] getAdmin failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get registered reporters
   * @returns {Array}
   */
  async getReporters() {
    if (!this.isReadReady()) return [];

    try {
      const result = await this._simulateCall('get_reporters');
      return scValToNative(result);
    } catch (err) {
      console.error(`[ContractService] getReporters failed: ${err.message}`);
      return [];
    }
  }

  // ────────────── Contract Info Endpoint ──────────────

  /**
   * Get a summary of the contract state (for API exposure)
   * @returns {Object}
   */
  async getContractInfo() {
    if (!this.isReadReady()) {
      return {
        enabled: false,
        message: 'Contract service not configured',
      };
    }

    try {
      const [snapshotCount, config, admin, reporters, latestSnapshot] = await Promise.allSettled([
        this.getSnapshotCount(),
        this.getConfig(),
        this.getAdmin(),
        this.getReporters(),
        this.getLatestSnapshot(),
      ]);

      return {
        enabled: true,
        contractId: this.contractId,
        network: this.networkPassphrase === Networks.PUBLIC ? 'mainnet' : 'testnet',
        rpcUrl: this.rpcUrl,
        snapshotCount: snapshotCount.status === 'fulfilled' ? snapshotCount.value : 0,
        config: config.status === 'fulfilled' ? config.value : null,
        admin: admin.status === 'fulfilled' ? admin.value : null,
        reporters: reporters.status === 'fulfilled' ? reporters.value : [],
        latestSnapshot: latestSnapshot.status === 'fulfilled' ? latestSnapshot.value : null,
        reporter: this.publicKey || null,
        writeEnabled: this.isWriteReady(),
      };
    } catch (err) {
      return {
        enabled: true,
        error: err.message,
      };
    }
  }

  // ────────────── Internal Helpers ──────────────

  /**
   * Build, simulate, sign, and submit a transaction
   */
  async _submitTransaction(operation) {
    const account = await this.server.getAccount(this.publicKey);

    let transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get the prepared transaction
    const simulated = await this.server.simulateTransaction(transaction);

    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Prepare the transaction with simulation results
    const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build();
    prepared.sign(this.keypair);

    // Submit
    const sendResponse = await this.server.sendTransaction(prepared);

    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResponse.errorResult}`);
    }

    // Poll for result
    let getResponse;
    let attempts = 0;
    const maxAttempts = 30;

    do {
      await this._sleep(1000);
      getResponse = await this.server.getTransaction(sendResponse.hash);
      attempts++;
    } while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts);

    if (getResponse.status === 'SUCCESS') {
      return {
        hash: sendResponse.hash,
        status: 'SUCCESS',
        ledger: getResponse.ledger,
      };
    }

    throw new Error(`Transaction failed with status: ${getResponse.status}`);
  }

  /**
   * Simulate a read-only contract call
   */
  async _simulateCall(method, ...args) {
    const account = this.publicKey
      ? await this.server.getAccount(this.publicKey)
      : await this._getDummyAccount();

    const operation = this.contract.call(method, ...args);

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(transaction);

    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    return simulated.result?.retval;
  }

  /**
   * Get a dummy account for read-only simulations
   */
  async _getDummyAccount() {
    const dummyKeypair = Keypair.random();
    return {
      accountId: () => dummyKeypair.publicKey(),
      sequenceNumber: () => '0',
      incrementSequenceNumber: () => {},
    };
  }

  /**
   * Parse a HealthSnapshot ScVal into a JS object
   */
  _parseSnapshot(scVal) {
    if (!scVal) return null;

    const native = scValToNative(scVal);
    return {
      ledgerSeq: Number(native.ledger_seq),
      tps: Number(native.tps_x100) / 100,
      tpsX100: Number(native.tps_x100),
      baseFeeStroops: Number(native.base_fee_stroops),
      closeTimeMs: Number(native.close_time_ms),
      closeTime: Number(native.close_time_ms) / 1000,
      p90FeeStroops: Number(native.p90_fee_stroops),
      status: STATUS_MAP[native.status] || 'unknown',
      statusCode: Number(native.status),
      txCount: Number(native.tx_count),
      opCount: Number(native.op_count),
      timestamp: Number(native.timestamp),
      reporter: native.reporter,
    };
  }

  /**
   * Parse Alert ScVal array into JS objects
   */
  _parseAlerts(scVal) {
    if (!scVal) return [];

    const native = scValToNative(scVal);
    return (native || []).map((a) => ({
      id: Number(a.id),
      severity: SEVERITY_MAP[a.severity] || 'info',
      severityCode: Number(a.severity),
      message: a.message,
      ledgerSeq: Number(a.ledger_seq),
      timestamp: Number(a.timestamp),
      reporter: a.reporter,
    }));
  }

  /**
   * Sleep helper
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ContractService;
