import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function LiveLog() {
  const logs = useStore((s) => s.logs);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="panel" id="live-log-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>🖥️</span> Live Terminal
        </h2>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {logs.length} entries
        </span>
      </div>
      <div className="panel-body">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <div className="empty-text">Waiting for network events...</div>
          </div>
        ) : (
          logs.slice(-50).map((log) => (
            <div className="log-entry" key={log.id}>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={`log-level ${log.level}`}>
                {log.level}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
