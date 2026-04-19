# 🛡️ Network Health Monitor — Soroban Smart Contract

A Stellar Soroban smart contract that records network health snapshots on-chain, enabling transparent, verifiable, and tamper-proof monitoring of the Stellar network.

## 📋 Overview

This contract complements the off-chain Live Network Health Monitor by persisting critical health metrics to the Stellar blockchain. Off-chain reporters (the backend service) periodically submit snapshots, and the contract automatically evaluates network health and generates on-chain alerts for anomalies.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Health Snapshots** | Store TPS, fees, close times, and tx counts on-chain |
| **Auto-Health Scoring** | Algorithmic status evaluation: Healthy / Moderate / Congested |
| **On-Chain Alerts** | Automatic alert generation for slow ledgers and fee spikes |
| **Role-Based Access** | Admin + authorized reporters with `require_auth()` |
| **Configurable Thresholds** | Admin-adjustable health evaluation parameters |
| **Historical Queries** | Retrieve snapshots by ledger sequence number |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Backend Server               │
│   (MetricsEngine + StellarService)      │
│                                         │
│  Polls Horizon API → computes metrics   │
│  Periodically submits snapshots ────────┼──┐
└─────────────────────────────────────────┘  │
                                              │
┌─────────────────────────────────────────┐  │
│       Soroban Smart Contract            │◄─┘
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  Snapshots   │  │  Health Config   │  │
│  │  (per ledger)│  │  (thresholds)    │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   Alerts     │  │   Reporters      │  │
│  │  (auto-gen)  │  │  (access ctrl)   │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
```

## 📦 Data Structures

### HealthSnapshot
| Field | Type | Description |
|-------|------|-------------|
| `ledger_seq` | `u64` | Ledger sequence number |
| `tps_x100` | `u32` | TPS × 100 (2-decimal precision) |
| `base_fee_stroops` | `u32` | Base fee in stroops |
| `close_time_ms` | `u32` | Ledger close time in milliseconds |
| `p90_fee_stroops` | `u32` | 90th percentile fee |
| `status` | `u32` | 0=healthy, 1=moderate, 2=congested |
| `tx_count` | `u32` | Successful transaction count |
| `op_count` | `u32` | Operation count |
| `timestamp` | `u64` | Unix timestamp (seconds) |
| `reporter` | `Address` | Submitter address |

### Alert
| Field | Type | Description |
|-------|------|-------------|
| `id` | `u64` | Unique alert ID |
| `severity` | `u32` | 0=info, 1=warning, 2=danger |
| `message` | `String` | Alert description |
| `ledger_seq` | `u64` | Related ledger sequence |
| `timestamp` | `u64` | Unix timestamp |
| `reporter` | `Address` | Who triggered the alert |

## 🔧 Contract Functions

### Initialization
```
initialize(admin: Address)
```
Sets the admin and default health thresholds.

### Reporter Management
```
add_reporter(reporter: Address)        // Admin only
remove_reporter(reporter: Address)     // Admin only
get_reporters() -> Vec<Address>
```

### Snapshot Operations
```
submit_snapshot(reporter, ledger_seq, tps_x100, base_fee_stroops, 
                close_time_ms, p90_fee_stroops, tx_count, op_count)
get_latest_snapshot() -> HealthSnapshot
get_snapshot(ledger_seq: u64) -> HealthSnapshot
get_snapshot_count() -> u64
```

### Alerts & Configuration
```
get_alerts() -> Vec<Alert>
get_config() -> HealthConfig
update_config(config: HealthConfig)    // Admin only
transfer_admin(new_admin: Address)     // Admin only
```

## 🚀 Build & Deploy

### Prerequisites
- [Rust](https://rustup.rs/) with `wasm32-unknown-unknown` target
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)

### Install Soroban CLI
```bash
cargo install --locked soroban-cli
```

### Add WASM Target
```bash
rustup target add wasm32-unknown-unknown
```

### Build
```bash
cd smart-contract
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM will be at:
```
target/wasm32-unknown-unknown/release/network_health_monitor.wasm
```

### Run Tests
```bash
cargo test
```

### Deploy to Testnet
```bash
# Generate a keypair (if needed)
soroban keys generate --global deployer --network testnet

# Deploy the contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/network_health_monitor.wasm \
  --source deployer \
  --network testnet

# Initialize with your admin address
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin <ADMIN_ADDRESS>
```

### Deploy to Mainnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/network_health_monitor.wasm \
  --source deployer \
  --network mainnet
```

## 🧪 Test Coverage

| Test | Description |
|------|-------------|
| `test_initialize` | Verifies admin set and count starts at 0 |
| `test_add_reporter` | Adds reporter and verifies list |
| `test_submit_snapshot_as_admin` | Admin submits healthy snapshot |
| `test_submit_snapshot_as_reporter` | Reporter submits moderate snapshot |
| `test_congested_status` | Verifies congested detection |
| `test_alert_on_slow_ledger` | Danger alert on >10s close time |
| `test_alert_on_fee_spike` | Danger alert on fee > threshold |
| `test_update_config` | Admin updates thresholds |
| `test_remove_reporter` | Reporter removal works |
| `test_transfer_admin` | Admin role transfer |
| `test_get_snapshot_by_ledger` | Historical snapshot query |
| `test_double_initialize` | Panics on re-initialization |
| `test_unauthorized_reporter` | Panics on unauthorized submission |

## 📄 License

MIT
