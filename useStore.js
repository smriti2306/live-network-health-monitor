/* ============================================
   STELLAR NETWORK HEALTH MONITOR — DESIGN SYSTEM
   ============================================ */

:root {
  /* Core Colors */
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-card: #151c2e;
  --bg-card-hover: #1a2340;
  --bg-glass: rgba(21, 28, 46, 0.65);

  /* Accent Colors */
  --accent-stellar: #6366f1;
  --accent-stellar-light: #818cf8;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-teal: #14b8a6;

  /* Status Colors */
  --status-healthy: #22c55e;
  --status-healthy-bg: rgba(34, 197, 94, 0.12);
  --status-moderate: #f59e0b;
  --status-moderate-bg: rgba(245, 158, 11, 0.12);
  --status-congested: #ef4444;
  --status-congested-bg: rgba(239, 68, 68, 0.12);

  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-accent: #a5b4fc;

  /* Border */
  --border-subtle: rgba(148, 163, 184, 0.08);
  --border-hover: rgba(99, 102, 241, 0.3);
  --border-glow: rgba(99, 102, 241, 0.5);

  /* Shadows */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.25);
  --shadow-glow: 0 0 30px rgba(99, 102, 241, 0.15);
  --shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.35);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============ RESET ============ */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  line-height: 1.6;
}

/* Background pattern */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(20, 184, 166, 0.04) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

#root {
  position: relative;
  z-index: 1;
}

/* ============ SCROLLBAR ============ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* ============ APP LAYOUT ============ */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ============ HEADER ============ */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 1.5rem;
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 1rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-stellar), var(--accent-cyan));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  color: white;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5); }
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.network-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition-base);
}

.network-badge:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.network-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-healthy .network-dot { background: var(--status-healthy); box-shadow: 0 0 8px var(--status-healthy); }
.status-moderate .network-dot { background: var(--status-moderate); box-shadow: 0 0 8px var(--status-moderate); }
.status-congested .network-dot { background: var(--status-congested); box-shadow: 0 0 8px var(--status-congested); }

.header-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.header-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

/* ============ MAIN CONTENT ============ */
.main-content {
  flex: 1;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

/* ============ METRIC CARDS GRID ============ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  position: relative;
  overflow: hidden;
  transition: var(--transition-base);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.metric-card.tps-card::before { background: linear-gradient(90deg, var(--accent-stellar), var(--accent-blue)); }
.metric-card.fee-card::before { background: linear-gradient(90deg, var(--accent-cyan), var(--accent-teal)); }
.metric-card.ledger-card::before { background: linear-gradient(90deg, var(--accent-blue), var(--accent-stellar-light)); }
.metric-card.status-card::before { background: linear-gradient(90deg, var(--status-healthy), var(--accent-teal)); }

.metric-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}

.metric-icon {
  font-size: 1.1rem;
  opacity: 0.6;
}

.metric-value {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 0.5rem;
  font-variant-numeric: tabular-nums;
}

.metric-value.healthy { color: var(--status-healthy); }
.metric-value.moderate { color: var(--status-moderate); }
.metric-value.congested { color: var(--status-congested); }

.metric-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-weight: 500;
}

/* ============ CHARTS GRID ============ */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  transition: var(--transition-base);
}

.chart-card:hover {
  border-color: var(--border-hover);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.6rem;
  border-radius: 100px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--accent-stellar-light);
}

.chart-body {
  width: 100%;
  height: 200px;
}

/* ============ BOTTOM PANELS ============ */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-base);
}

.panel:hover {
  border-color: var(--border-hover);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-body {
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

/* ============ TERMINAL LOG ============ */
.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.55rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
  line-height: 1.45;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.log-time {
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.log-level {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 42px;
}

.log-level.info { color: var(--accent-blue); }
.log-level.success { color: var(--status-healthy); }
.log-level.warning { color: var(--status-moderate); }
.log-level.error { color: var(--status-congested); }

.log-message {
  color: var(--text-secondary);
  word-break: break-word;
}

/* ============ ALERTS ============ */
.alert-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.alert-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.alert-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
}

.alert-time {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-top: 0.15rem;
}

.alert-severity-warning { border-left: 3px solid var(--status-moderate); }
.alert-severity-danger { border-left: 3px solid var(--status-congested); }

/* ============ SKELETON LOADING ============ */
.skeleton {
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text { height: 1rem; width: 60%; }
.skeleton-value { height: 2.5rem; width: 45%; margin-bottom: 0.5rem; }
.skeleton-chart { height: 200px; width: 100%; }

/* ============ EMPTY STATE ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.8rem;
}

/* ============ CONNECTION STATUS ============ */
.connection-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.72rem;
  font-weight: 500;
  text-align: center;
  animation: slideDown 300ms ease-out;
}

.connection-bar.connecting {
  background: rgba(245, 158, 11, 0.12);
  color: var(--status-moderate);
}

.connection-bar.disconnected {
  background: rgba(239, 68, 68, 0.12);
  color: var(--status-congested);
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ============ ANIMATIONS ============ */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 400ms ease-out;
}

@keyframes countUp {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.count-up {
  animation: countUp 300ms ease-out;
}

/* ============ FEE DETAILS ============ */
.fee-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 1rem 1.25rem;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.65rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.fee-label {
  color: var(--text-muted);
  font-weight: 500;
}

.fee-value {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 600;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .header-inner {
    height: 56px;
  }
  .header-title {
    font-size: 0.9rem;
  }
  .header-subtitle {
    display: none;
  }
  .main-content {
    padding: 1rem;
  }
  .metric-value {
    font-size: 1.6rem;
  }
  .fee-details {
    grid-template-columns: 1fr;
  }
  .header-btn span {
    display: none;
  }
}
