import { useStore } from '../store/useStore';

export default function FeeDetails() {
  const metrics = useStore((s) => s.metrics);

  const feeStats = metrics?.feeStats;

  if (!feeStats) {
    return (
      <div className="chart-card" id="fee-details-panel">
        <div className="chart-header">
          <h2 className="chart-title">📊 Fee Distribution</h2>
        </div>
        <div className="skeleton skeleton-chart"></div>
      </div>
    );
  }

  const items = [
    { label: 'Min Fee', value: feeStats.minFee },
    { label: 'Mode Fee', value: feeStats.modeAcceptedFee },
    { label: 'P10', value: feeStats.p10Fee },
    { label: 'P50', value: feeStats.p50Fee },
    { label: 'P90', value: feeStats.p90Fee },
    { label: 'P95', value: feeStats.p95Fee },
    { label: 'P99', value: feeStats.p99Fee },
    { label: 'Max Fee', value: feeStats.maxFee },
  ];

  const capacityPct = feeStats.capacityUsage
    ? (parseFloat(feeStats.capacityUsage) * 100).toFixed(1)
    : null;

  return (
    <div className="chart-card" id="fee-details-panel">
      <div className="chart-header">
        <h2 className="chart-title">📊 Fee Distribution</h2>
        {capacityPct && (
          <span className="chart-badge" style={{
            background: parseFloat(capacityPct) > 70
              ? 'rgba(239, 68, 68, 0.12)'
              : parseFloat(capacityPct) > 40
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(34, 197, 94, 0.12)',
            color: parseFloat(capacityPct) > 70
              ? '#ef4444'
              : parseFloat(capacityPct) > 40
                ? '#f59e0b'
                : '#22c55e',
          }}>
            {capacityPct}% capacity
          </span>
        )}
      </div>
      <div className="fee-details fade-in">
        {items.map((item) => (
          <div className="fee-item" key={item.label}>
            <span className="fee-label">{item.label}</span>
            <span className="fee-value">{item.value ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
