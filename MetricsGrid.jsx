import { useStore } from '../store/useStore';

export default function Header() {
  const metrics = useStore((s) => s.metrics);
  const network = useStore((s) => s.network);
  const exportCSV = useStore((s) => s.exportCSV);

  const status = metrics?.networkStatus || 'unknown';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo">✦</div>
          <div>
            <div className="header-title">Stellar Network Monitor</div>
            <div className="header-subtitle">Real-Time Health Dashboard</div>
          </div>
        </div>

        <div className="header-actions">
          <div className={`network-badge status-${status}`}>
            <span className="network-dot"></span>
            {network}
          </div>

          <button className="header-btn" onClick={exportCSV} id="export-btn" title="Export metrics as CSV">
            📥 <span>Export</span>
          </button>

          <button
            className="header-btn"
            onClick={() => window.location.reload()}
            id="refresh-btn"
            title="Refresh dashboard"
          >
            🔄 <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
