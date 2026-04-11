import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{
      background: 'rgba(21, 28, 46, 0.95)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '8px',
      padding: '0.6rem 0.85rem',
      fontSize: '0.75rem',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem' }}>
        {payload[0].value?.toFixed(2)} TPS
      </div>
    </div>
  );
}

export default function TPSChart() {
  const history = useStore((s) => s.history);
  const isLoading = useStore((s) => s.isLoading);

  const data = useMemo(() => {
    return history
      .filter((h) => h.tps !== undefined && h.tps !== null)
      .slice(-60)
      .map((h) => ({
        time: formatTime(h.timestamp),
        tps: h.tps,
      }));
  }, [history]);

  return (
    <div className="chart-card" id="chart-tps">
      <div className="chart-header">
        <h2 className="chart-title">⚡ Transaction Rate (TPS)</h2>
        <span className="chart-badge">Live</span>
      </div>
      <div className="chart-body">
        {isLoading || data.length < 2 ? (
          <div className="skeleton skeleton-chart"></div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="tps"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#tpsGradient)"
                animationDuration={300}
                dot={false}
                activeDot={{ r: 4, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
