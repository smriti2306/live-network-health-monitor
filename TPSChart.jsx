import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getBarColor(closeTime) {
  if (closeTime === null || closeTime === undefined) return '#64748b';
  if (closeTime <= 6) return '#22c55e';
  if (closeTime <= 10) return '#f59e0b';
  return '#ef4444';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.[0]) return null;
  const val = payload[0].value;
  const color = getBarColor(val);
  return (
    <div style={{
      background: 'rgba(21, 28, 46, 0.95)',
      border: `1px solid ${color}40`,
      borderRadius: '8px',
      padding: '0.6rem 0.85rem',
      fontSize: '0.75rem',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>
        {val?.toFixed(1)}s close time
      </div>
    </div>
  );
}

export default function LedgerChart() {
  const history = useStore((s) => s.history);
  const isLoading = useStore((s) => s.isLoading);

  const data = useMemo(() => {
    return history
      .filter((h) => h.closeTime !== null && h.closeTime !== undefined)
      .slice(-40)
      .map((h) => ({
        time: formatTime(h.timestamp),
        closeTime: h.closeTime,
      }));
  }, [history]);

  return (
    <div className="chart-card" id="chart-ledger">
      <div className="chart-header">
        <h2 className="chart-title">⏱️ Ledger Close Time</h2>
        <span className="chart-badge">Live</span>
      </div>
      <div className="chart-body">
        {isLoading || data.length < 2 ? (
          <div className="skeleton skeleton-chart"></div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="closeTime" radius={[4, 4, 0, 0]} animationDuration={300}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.closeTime)} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
