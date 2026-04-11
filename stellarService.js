import { EventEmitter } from 'events';

const MAX_HISTORY_POINTS = 500;
const MAX_LOG_ENTRIES = 200;
const POLL_INTERVAL = 5000; // 5 seconds

export class MetricsEngine extends EventEmitter {
  constructor(stellarService) {
    super();
    this.stellar = stellarService;
    this.history = [];
    this.alerts = [];
    this.logs = [];
    this.latestMetrics = null;
    this.txBuffer = [];
    this.lastLedgerTime = null;
    this.lastLedgerSeq = null;
    this.pollTimer = null;
    this.closeLedgerStream = null;
    this.closeTxStream = null;
    this.txCountInWindow = 0;
    this.windowStart = Date.now();
  }

  async start() {
    this.addLog('info', 'Initializing Stellar Network Health Monitor...');

    // Fetch initial data
    try {
      const recentLedgers = await this.stellar.getRecentLedgers(20);
      this.addLog('info', `Loaded ${recentLedgers.length} recent ledgers`);

      // Compute initial metrics from recent ledgers
      for (const ledger of recentLedgers) {
        this.processLedger(ledger, false);
      }

      // Fetch initial fee stats
      const feeStats = await this.stellar.getFeeStats();
      this.updateFeeMetrics(feeStats);
      this.addLog('success', 'Initial data loaded successfully');
    } catch (err) {
      this.addLog('error', `Failed to load initial data: ${err.message}`);
    }

    // Start streaming
    try {
      this.closeLedgerStream = this.stellar.streamLedgers((ledger) => {
        this.processLedger(ledger, true);
      });
      this.addLog('info', 'Ledger stream connected');

      this.closeTxStream = this.stellar.streamTransactions((tx) => {
        this.processTransaction(tx);
      });
      this.addLog('info', 'Transaction stream connected');
    } catch (err) {
      this.addLog('warning', `Streaming unavailable, using polling: ${err.message}`);
    }

    // Poll fee stats periodically
    this.pollTimer = setInterval(async () => {
      try {
        const feeStats = await this.stellar.getFeeStats();
        this.updateFeeMetrics(feeStats);
      } catch (err) {
        this.addLog('error', `Fee poll failed: ${err.message}`);
      }
    }, POLL_INTERVAL);

    // Compute TPS every 2 seconds
    this.tpsTimer = setInterval(() => {
      this.computeTPS();
    }, 2000);
  }

  processLedger(ledger, isLive = true) {
    const closedAt = new Date(ledger.closed_at).getTime();
    const sequence = ledger.sequence;
    const txCount = ledger.successful_transaction_count || 0;
    const opCount = ledger.operation_count || 0;
    const baseFee = ledger.base_fee_in_stroops || 100;

    let closeTime = null;
    if (this.lastLedgerTime) {
      closeTime = (closedAt - this.lastLedgerTime) / 1000;
    }

    this.lastLedgerTime = closedAt;
    this.lastLedgerSeq = sequence;

    const metrics = {
      timestamp: new Date(closedAt).toISOString(),
      ledgerSequence: sequence,
      txCount,
      opCount,
      baseFee: baseFee / 10000000,
      baseFeeStroops: baseFee,
      closeTime,
      tps: this.latestMetrics?.tps || 0,
      feeStats: this.latestMetrics?.feeStats || null,
      networkStatus: 'healthy',
    };

    // Determine network status
    metrics.networkStatus = this.evaluateHealth(metrics);

    this.latestMetrics = { ...this.latestMetrics, ...metrics };

    // Add to history
    this.history.push({
      timestamp: metrics.timestamp,
      ledgerSequence: sequence,
      tps: metrics.tps,
      closeTime: closeTime,
      txCount,
      opCount,
      baseFee: metrics.baseFee,
      baseFeeStroops: baseFee,
      networkStatus: metrics.networkStatus,
    });

    // Trim history
    if (this.history.length > MAX_HISTORY_POINTS) {
      this.history = this.history.slice(-MAX_HISTORY_POINTS);
    }

    if (isLive) {
      this.addLog('info', `Ledger #${sequence} closed — ${txCount} txs, ${opCount} ops`);
      this.emit('update', this.latestMetrics);

      // Check for alerts
      if (closeTime && closeTime > 10) {
        this.triggerAlert('warning', `Slow ledger close: ${closeTime.toFixed(1)}s (Ledger #${sequence})`);
      }
    }
  }

  processTransaction(tx) {
    this.txCountInWindow++;
    this.txBuffer.push({
      hash: tx.hash,
      timestamp: tx.created_at,
      fee: parseInt(tx.fee_charged) || 0,
      opCount: tx.operation_count || 0,
      successful: tx.successful,
    });

    // Keep buffer manageable
    if (this.txBuffer.length > 200) {
      this.txBuffer = this.txBuffer.slice(-200);
    }
  }

  computeTPS() {
    const now = Date.now();
    const elapsed = (now - this.windowStart) / 1000;

    if (elapsed > 0) {
      const tps = this.txCountInWindow / elapsed;
      if (this.latestMetrics) {
        this.latestMetrics.tps = Math.round(tps * 100) / 100;
      }
    }

    // Reset window every 10 seconds
    if (elapsed > 10) {
      this.txCountInWindow = 0;
      this.windowStart = now;
    }

    if (this.latestMetrics) {
      this.emit('update', this.latestMetrics);
    }
  }

  updateFeeMetrics(feeStats) {
    if (!feeStats) return;

    const parsed = {
      lastBaseFee: feeStats.last_ledger_base_fee,
      minFee: feeStats.min_accepted_fee,
      modeAcceptedFee: feeStats.mode_accepted_fee,
      p10Fee: feeStats.fee_charged?.p10,
      p20Fee: feeStats.fee_charged?.p20,
      p50Fee: feeStats.fee_charged?.p50,
      p70Fee: feeStats.fee_charged?.p70,
      p90Fee: feeStats.fee_charged?.p90,
      p95Fee: feeStats.fee_charged?.p95,
      p99Fee: feeStats.fee_charged?.p99,
      maxFee: feeStats.fee_charged?.max,
      capacityUsage: feeStats.ledger_capacity_usage,
    };

    if (this.latestMetrics) {
      const prevP90 = this.latestMetrics.feeStats?.p90Fee;
      this.latestMetrics.feeStats = parsed;

      // Detect fee spike
      if (prevP90 && parsed.p90Fee && parseInt(parsed.p90Fee) > parseInt(prevP90) * 2) {
        this.triggerAlert('danger', `Fee spike detected! P90 fee surged from ${prevP90} to ${parsed.p90Fee} stroops`);
      }
    }
  }

  evaluateHealth(metrics) {
    let score = 0;

    // Close time assessment
    if (metrics.closeTime !== null) {
      if (metrics.closeTime <= 6) score += 2;
      else if (metrics.closeTime <= 10) score += 1;
      else score -= 1;
    }

    // TPS assessment
    if (metrics.tps > 0) score += 1;
    if (metrics.tps > 5) score += 1;

    // Fee assessment
    if (metrics.feeStats) {
      const p90 = parseInt(metrics.feeStats.p90Fee || 0);
      if (p90 <= 200) score += 1;
      else if (p90 > 500) score -= 1;
    }

    if (score >= 3) return 'healthy';
    if (score >= 1) return 'moderate';
    return 'congested';
  }

  triggerAlert(severity, message) {
    const alert = {
      id: Date.now(),
      severity,
      message,
      timestamp: new Date().toISOString(),
    };
    this.alerts.push(alert);
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    this.addLog(severity === 'danger' ? 'error' : 'warning', message);
    this.emit('alert', alert);
  }

  addLog(level, message) {
    const entry = {
      id: Date.now() + Math.random(),
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
    }
    this.emit('log', entry);
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  getSnapshot() {
    if (!this.latestMetrics) return null;
    return {
      metrics: this.latestMetrics,
      history: this.history.slice(-100),
      alerts: this.alerts.slice(-20),
      logs: this.logs.slice(-50),
      network: this.stellar.networkName,
    };
  }

  getHealthStatus() {
    return {
      overall: this.latestMetrics?.networkStatus || 'unknown',
      lastLedger: this.lastLedgerSeq,
      lastUpdate: this.latestMetrics?.timestamp || null,
      network: this.stellar.networkName,
      streamsActive: !!(this.closeLedgerStream && this.closeTxStream),
    };
  }

  getHistory(hours = 1) {
    const cutoff = Date.now() - hours * 3600 * 1000;
    return this.history.filter((h) => new Date(h.timestamp).getTime() > cutoff);
  }

  exportCSV(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.tpsTimer) clearInterval(this.tpsTimer);
    if (this.closeLedgerStream) this.closeLedgerStream();
    if (this.closeTxStream) this.closeTxStream();
    this.addLog('info', 'Monitor stopped');
  }
}
