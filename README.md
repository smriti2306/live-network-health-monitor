# 🌟 Live Stellar Network Health Monitor

A real-time dashboard for monitoring the Stellar blockchain network health, including TPS, fee statistics, ledger close times, and network status indicators.

![Stellar Monitor](https://img.shields.io/badge/Stellar-Network_Monitor-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge)

## ✨ Features

- **Real-time TPS tracking** — Transactions per second computed from live streams
- **Fee statistics** — Base fee, percentile distribution (P10-P99), capacity usage
- **Ledger close time** — Visual bar chart with color-coded health indicators
- **Network health scoring** — Automated status: Healthy / Moderate / Congested
- **Live terminal log** — Terminal-style event feed with color-coded severity
- **Alert system** — Automatic detection of fee spikes and slow ledgers
- **CSV export** — Download historical metrics data
- **WebSocket reconnection** — Auto-reconnect with fallback polling
- **Responsive design** — Mobile-first with stacked → 2-column → full grid
- **Dark mode UI** — Web3-inspired glassmorphism design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Vanilla CSS (custom design system) |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js + Express |
| WebSocket | `ws` library |
| Blockchain | Stellar SDK (`@stellar/stellar-sdk`) |
| API | Stellar Horizon API |

## 📦 Project Structure

```
├── backend/
│   ├── server.js              # Express + WebSocket server
│   ├── services/
│   │   ├── stellarService.js  # Horizon API integration
│   │   └── metricsEngine.js   # TPS computation, health scoring, alerts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main dashboard layout
│   │   ├── index.css          # Complete design system
│   │   ├── store/
│   │   │   └── useStore.js    # Zustand state + WebSocket manager
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── MetricsGrid.jsx
│   │       ├── TPSChart.jsx
│   │       ├── FeeChart.jsx
│   │       ├── LedgerChart.jsx
│   │       ├── FeeDetails.jsx
│   │       ├── LiveLog.jsx
│   │       ├── AlertsPanel.jsx
│   │       └── ConnectionBar.jsx
│   ├── .env
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend starts on `http://localhost:3001` and connects to Stellar Mainnet Horizon.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

### 3. Open Dashboard

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics` | GET | Latest computed metrics snapshot |
| `/api/health` | GET | System health status |
| `/api/history?hours=1` | GET | Historical data points |
| `/api/export` | GET | Download metrics as CSV |
| `/ws` | WebSocket | Real-time metric updates |

## ⚙️ Environment Variables

### Backend (`.env`)
```
HORIZON_URL=https://horizon.stellar.org
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env`)
```
VITE_WS_URL=ws://localhost:3001/ws
VITE_API_URL=http://localhost:3001/api
```

### Toggle Testnet
Change `HORIZON_URL` to `https://horizon-testnet.stellar.org` in the backend `.env`.

## 📊 Metric Computations

- **TPS**: Counted via live transaction stream over 10-second sliding windows
- **Health Score**: Composite of close time (≤6s = good), TPS activity, and fee levels
- **Fee Spike Detection**: Triggers alert when P90 fee doubles between poll intervals
- **Slow Ledger Alert**: Triggers when close time exceeds 10 seconds

## 🎨 Design System

The UI uses a custom CSS design system with:
- HSL-tuned color palette (Indigo/Cyan/Teal accents)
- Glassmorphism cards with backdrop blur
- JetBrains Mono for terminal/data displays
- Inter for UI typography
- Smooth gradient fills on charts
- Micro-animations (pulse, shimmer, fade-in)
- Responsive breakpoints: 640px / 1024px

## 📄 License

MIT
