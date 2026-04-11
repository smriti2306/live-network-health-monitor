import { useStore } from '../store/useStore';

export default function AlertsPanel() {
  const alerts = useStore((s) => s.alerts);

  return (
    <div className="panel" id="alerts-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>🔔</span> Alerts
        </h2>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {alerts.length} total
        </span>
      </div>
      <div className="panel-body">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">No alerts — network is operating normally</div>
          </div>
        ) : (
          [...alerts].reverse().slice(0, 20).map((alert) => (
            <div
              className={`alert-entry alert-severity-${alert.severity}`}
              key={alert.id}
            >
              <span className="alert-icon">
                {alert.severity === 'danger' ? '🚨' : '⚠️'}
              </span>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
