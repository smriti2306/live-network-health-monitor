#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Vec,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    /// Latest health snapshot
    LatestSnapshot,
    /// Snapshot at a given sequence number
    Snapshot(u64),
    /// List of registered reporter addresses
    Reporters,
    /// Total number of snapshots stored
    SnapshotCount,
    /// Alert log entries
    Alerts,
    /// Configuration thresholds
    Config,
}

// ─── Data Structures ─────────────────────────────────────────────────────────

/// Represents a point-in-time health snapshot of the Stellar network
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct HealthSnapshot {
    /// Ledger sequence number when the snapshot was recorded
    pub ledger_seq: u64,
    /// Transactions per second (multiplied by 100 for 2-decimal precision)
    pub tps_x100: u32,
    /// Base fee in stroops
    pub base_fee_stroops: u32,
    /// Ledger close time in milliseconds
    pub close_time_ms: u32,
    /// P90 fee in stroops
    pub p90_fee_stroops: u32,
    /// Network status: 0 = healthy, 1 = moderate, 2 = congested
    pub status: u32,
    /// Successful transaction count in the ledger
    pub tx_count: u32,
    /// Operation count in the ledger
    pub op_count: u32,
    /// Unix timestamp (seconds) when the snapshot was recorded
    pub timestamp: u64,
    /// Address of the reporter who submitted this snapshot
    pub reporter: Address,
}

/// Alert record stored on-chain
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Alert {
    /// Unique alert ID
    pub id: u64,
    /// Severity: 0 = info, 1 = warning, 2 = danger
    pub severity: u32,
    /// Alert message
    pub message: String,
    /// Related ledger sequence
    pub ledger_seq: u64,
    /// Unix timestamp
    pub timestamp: u64,
    /// Reporter who triggered the alert
    pub reporter: Address,
}

/// Configuration thresholds for health evaluation
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct HealthConfig {
    /// Close time threshold for "healthy" status (ms)
    pub healthy_close_time_ms: u32,
    /// Close time threshold for "moderate" status (ms)
    pub moderate_close_time_ms: u32,
    /// TPS threshold — below this is considered low activity
    pub min_tps_x100: u32,
    /// Fee threshold (stroops) — above this indicates congestion
    pub congestion_fee_stroops: u32,
    /// Maximum number of snapshots to retain
    pub max_snapshots: u32,
    /// Maximum number of alerts to retain
    pub max_alerts: u32,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct NetworkHealthMonitor;

#[contractimpl]
impl NetworkHealthMonitor {
    // ───────────────────── Initialization ─────────────────────

    /// Initialize the contract with an admin address and default config
    pub fn initialize(env: Env, admin: Address) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SnapshotCount, &0u64);

        // Default configuration
        let config = HealthConfig {
            healthy_close_time_ms: 6000,    // 6 seconds
            moderate_close_time_ms: 10000,  // 10 seconds
            min_tps_x100: 50,               // 0.5 TPS minimum
            congestion_fee_stroops: 500,
            max_snapshots: 100,
            max_alerts: 50,
        };
        env.storage().instance().set(&DataKey::Config, &config);

        // Initialize empty reporters list
        let reporters: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Reporters, &reporters);

        // Initialize empty alerts list
        let alerts: Vec<Alert> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::Alerts, &alerts);

        env.events().publish(
            (symbol_short!("init"),),
            admin,
        );
    }

    // ───────────────────── Reporter Management ─────────────────────

    /// Add a reporter who is allowed to submit health snapshots
    pub fn add_reporter(env: Env, reporter: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut reporters: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Reporters)
            .unwrap_or(Vec::new(&env));

        // Check reporter is not already registered
        let mut found = false;
        for i in 0..reporters.len() {
            if reporters.get(i).unwrap() == reporter {
                found = true;
                break;
            }
        }
        if !found {
            reporters.push_back(reporter.clone());
            env.storage().instance().set(&DataKey::Reporters, &reporters);

            env.events().publish(
                (symbol_short!("reporter"), symbol_short!("add")),
                reporter,
            );
        }
    }

    /// Remove a reporter
    pub fn remove_reporter(env: Env, reporter: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let reporters: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Reporters)
            .unwrap_or(Vec::new(&env));

        let mut new_reporters: Vec<Address> = Vec::new(&env);
        for i in 0..reporters.len() {
            let r = reporters.get(i).unwrap();
            if r != reporter {
                new_reporters.push_back(r);
            }
        }

        env.storage().instance().set(&DataKey::Reporters, &new_reporters);

        env.events().publish(
            (symbol_short!("reporter"), symbol_short!("remove")),
            reporter,
        );
    }

    /// List all registered reporters
    pub fn get_reporters(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Reporters)
            .unwrap_or(Vec::new(&env))
    }

    // ───────────────────── Snapshot Submission ─────────────────────

    /// Submit a network health snapshot (called by authorized reporters)
    pub fn submit_snapshot(
        env: Env,
        reporter: Address,
        ledger_seq: u64,
        tps_x100: u32,
        base_fee_stroops: u32,
        close_time_ms: u32,
        p90_fee_stroops: u32,
        tx_count: u32,
        op_count: u32,
    ) {
        reporter.require_auth();

        // Verify reporter is authorized
        let reporters: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Reporters)
            .unwrap_or(Vec::new(&env));

        let mut authorized = false;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if reporter == admin {
            authorized = true;
        } else {
            for i in 0..reporters.len() {
                if reporters.get(i).unwrap() == reporter {
                    authorized = true;
                    break;
                }
            }
        }

        if !authorized {
            panic!("unauthorized reporter");
        }

        // Load config for health evaluation
        let config: HealthConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .unwrap();

        // Evaluate network status
        let status = Self::evaluate_health(
            tps_x100,
            close_time_ms,
            p90_fee_stroops,
            &config,
        );

        let snapshot = HealthSnapshot {
            ledger_seq,
            tps_x100,
            base_fee_stroops,
            close_time_ms,
            p90_fee_stroops,
            status,
            tx_count,
            op_count,
            timestamp: env.ledger().timestamp(),
            reporter: reporter.clone(),
        };

        // Store snapshot
        env.storage()
            .persistent()
            .set(&DataKey::Snapshot(ledger_seq), &snapshot);
        env.storage()
            .instance()
            .set(&DataKey::LatestSnapshot, &snapshot);

        // Increment count
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SnapshotCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::SnapshotCount, &(count + 1));

        // Auto-generate alerts for anomalies
        if close_time_ms > config.moderate_close_time_ms {
            Self::_add_alert(
                &env,
                2, // danger
                String::from_str(&env, "Slow ledger close detected"),
                ledger_seq,
                reporter.clone(),
            );
        } else if close_time_ms > config.healthy_close_time_ms {
            Self::_add_alert(
                &env,
                1, // warning
                String::from_str(&env, "Elevated ledger close time"),
                ledger_seq,
                reporter.clone(),
            );
        }

        if p90_fee_stroops > config.congestion_fee_stroops {
            Self::_add_alert(
                &env,
                2, // danger
                String::from_str(&env, "Fee spike detected"),
                ledger_seq,
                reporter.clone(),
            );
        }

        env.events().publish(
            (symbol_short!("snapshot"), symbol_short!("submit")),
            ledger_seq,
        );
    }

    // ───────────────────── Queries ─────────────────────

    /// Get the latest health snapshot
    pub fn get_latest_snapshot(env: Env) -> HealthSnapshot {
        env.storage()
            .instance()
            .get(&DataKey::LatestSnapshot)
            .expect("no snapshots yet")
    }

    /// Get a snapshot by ledger sequence number
    pub fn get_snapshot(env: Env, ledger_seq: u64) -> HealthSnapshot {
        env.storage()
            .persistent()
            .get(&DataKey::Snapshot(ledger_seq))
            .expect("snapshot not found")
    }

    /// Get total snapshot count
    pub fn get_snapshot_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::SnapshotCount)
            .unwrap_or(0)
    }

    /// Get all stored alerts
    pub fn get_alerts(env: Env) -> Vec<Alert> {
        env.storage()
            .persistent()
            .get(&DataKey::Alerts)
            .unwrap_or(Vec::new(&env))
    }

    /// Get current health configuration
    pub fn get_config(env: Env) -> HealthConfig {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized")
    }

    /// Get the admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }

    // ───────────────────── Admin Functions ─────────────────────

    /// Update health thresholds (admin only)
    pub fn update_config(env: Env, config: HealthConfig) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().instance().set(&DataKey::Config, &config);

        env.events().publish(
            (symbol_short!("config"), symbol_short!("update")),
            true,
        );
    }

    /// Transfer admin role to a new address
    pub fn transfer_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);

        env.events().publish(
            (symbol_short!("admin"), symbol_short!("xfer")),
            new_admin,
        );
    }

    // ───────────────────── Internal Helpers ─────────────────────

    /// Evaluate network health based on metrics and configuration thresholds
    fn evaluate_health(
        tps_x100: u32,
        close_time_ms: u32,
        p90_fee_stroops: u32,
        config: &HealthConfig,
    ) -> u32 {
        let mut score: i32 = 0;

        // Close time assessment
        if close_time_ms <= config.healthy_close_time_ms {
            score += 2;
        } else if close_time_ms <= config.moderate_close_time_ms {
            score += 1;
        } else {
            score -= 1;
        }

        // TPS assessment
        if tps_x100 > 0 {
            score += 1;
        }
        if tps_x100 > config.min_tps_x100 {
            score += 1;
        }

        // Fee assessment
        if p90_fee_stroops <= 200 {
            score += 1;
        } else if p90_fee_stroops > config.congestion_fee_stroops {
            score -= 1;
        }

        // 0 = healthy, 1 = moderate, 2 = congested
        if score >= 3 {
            0
        } else if score >= 1 {
            1
        } else {
            2
        }
    }

    /// Internal helper to add an alert to storage
    fn _add_alert(
        env: &Env,
        severity: u32,
        message: String,
        ledger_seq: u64,
        reporter: Address,
    ) {
        let mut alerts: Vec<Alert> = env
            .storage()
            .persistent()
            .get(&DataKey::Alerts)
            .unwrap_or(Vec::new(env));

        let config: HealthConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .unwrap();

        let alert_id = alerts.len() as u64 + 1;

        let alert = Alert {
            id: alert_id,
            severity,
            message,
            ledger_seq,
            timestamp: env.ledger().timestamp(),
            reporter,
        };

        alerts.push_back(alert);

        // Trim if exceeding max
        while alerts.len() > config.max_alerts {
            alerts.remove(0);
        }

        env.storage().persistent().set(&DataKey::Alerts, &alerts);

        env.events().publish(
            (symbol_short!("alert"), symbol_short!("new")),
            alert_id,
        );
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    fn setup_contract() -> (Env, NetworkHealthMonitorClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, NetworkHealthMonitor);
        let client = NetworkHealthMonitorClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        (env, client, admin)
    }

    #[test]
    fn test_initialize() {
        let (_env, client, admin) = setup_contract();

        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_snapshot_count(), 0);
    }

    #[test]
    fn test_add_reporter() {
        let (env, client, _admin) = setup_contract();
        let reporter = Address::generate(&env);

        client.add_reporter(&reporter);

        let reporters = client.get_reporters();
        assert_eq!(reporters.len(), 1);
        assert_eq!(reporters.get(0).unwrap(), reporter);
    }

    #[test]
    fn test_submit_snapshot_as_admin() {
        let (_env, client, admin) = setup_contract();

        client.submit_snapshot(
            &admin,
            &1000u64,  // ledger_seq
            &150u32,   // tps_x100 (1.5 TPS)
            &100u32,   // base_fee_stroops
            &5000u32,  // close_time_ms (5s — healthy)
            &120u32,   // p90_fee_stroops
            &25u32,    // tx_count
            &50u32,    // op_count
        );

        let snapshot = client.get_latest_snapshot();
        assert_eq!(snapshot.ledger_seq, 1000);
        assert_eq!(snapshot.tps_x100, 150);
        assert_eq!(snapshot.status, 0); // healthy
        assert_eq!(client.get_snapshot_count(), 1);
    }

    #[test]
    fn test_submit_snapshot_as_reporter() {
        let (env, client, _admin) = setup_contract();
        let reporter = Address::generate(&env);

        client.add_reporter(&reporter);

        client.submit_snapshot(
            &reporter,
            &2000u64,
            &80u32,
            &100u32,
            &7000u32,  // 7s — moderate
            &300u32,
            &15u32,
            &30u32,
        );

        let snapshot = client.get_latest_snapshot();
        assert_eq!(snapshot.ledger_seq, 2000);
        assert_eq!(snapshot.status, 1); // moderate
    }

    #[test]
    fn test_congested_status() {
        let (_env, client, admin) = setup_contract();

        client.submit_snapshot(
            &admin,
            &3000u64,
            &0u32,       // 0 TPS
            &100u32,
            &12000u32,   // 12s — very slow
            &800u32,     // high fee
            &2u32,
            &3u32,
        );

        let snapshot = client.get_latest_snapshot();
        assert_eq!(snapshot.status, 2); // congested
    }

    #[test]
    fn test_alert_on_slow_ledger() {
        let (_env, client, admin) = setup_contract();

        client.submit_snapshot(
            &admin,
            &4000u64,
            &100u32,
            &100u32,
            &11000u32, // > 10s threshold → danger alert
            &150u32,
            &10u32,
            &20u32,
        );

        let alerts = client.get_alerts();
        assert!(alerts.len() >= 1);
        assert_eq!(alerts.get(0).unwrap().severity, 2); // danger
    }

    #[test]
    fn test_alert_on_fee_spike() {
        let (_env, client, admin) = setup_contract();

        client.submit_snapshot(
            &admin,
            &5000u64,
            &200u32,
            &100u32,
            &5000u32,
            &600u32,   // > 500 threshold → fee spike
            &50u32,
            &100u32,
        );

        let alerts = client.get_alerts();
        let has_fee_alert = alerts.iter().any(|a| a.severity == 2);
        assert!(has_fee_alert);
    }

    #[test]
    fn test_update_config() {
        let (_env, client, _admin) = setup_contract();

        let new_config = HealthConfig {
            healthy_close_time_ms: 5000,
            moderate_close_time_ms: 8000,
            min_tps_x100: 100,
            congestion_fee_stroops: 300,
            max_snapshots: 200,
            max_alerts: 100,
        };

        client.update_config(&new_config);

        let config = client.get_config();
        assert_eq!(config.healthy_close_time_ms, 5000);
        assert_eq!(config.max_alerts, 100);
    }

    #[test]
    fn test_remove_reporter() {
        let (env, client, _admin) = setup_contract();
        let reporter = Address::generate(&env);

        client.add_reporter(&reporter);
        assert_eq!(client.get_reporters().len(), 1);

        client.remove_reporter(&reporter);
        assert_eq!(client.get_reporters().len(), 0);
    }

    #[test]
    fn test_transfer_admin() {
        let (env, client, admin) = setup_contract();
        let new_admin = Address::generate(&env);

        client.transfer_admin(&new_admin);
        assert_eq!(client.get_admin(), new_admin);
        assert_ne!(client.get_admin(), admin);
    }

    #[test]
    fn test_get_snapshot_by_ledger() {
        let (_env, client, admin) = setup_contract();

        client.submit_snapshot(
            &admin,
            &6000u64,
            &300u32,
            &100u32,
            &4000u32,
            &100u32,
            &40u32,
            &80u32,
        );

        let snapshot = client.get_snapshot(&6000u64);
        assert_eq!(snapshot.ledger_seq, 6000);
        assert_eq!(snapshot.tx_count, 40);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize() {
        let (env, client, admin) = setup_contract();
        let other = Address::generate(&env);
        client.initialize(&other);
    }

    #[test]
    #[should_panic(expected = "unauthorized reporter")]
    fn test_unauthorized_reporter() {
        let (env, client, _admin) = setup_contract();
        let rogue = Address::generate(&env);

        client.submit_snapshot(
            &rogue,
            &9999u64,
            &100u32,
            &100u32,
            &5000u32,
            &100u32,
            &10u32,
            &20u32,
        );
    }
}
