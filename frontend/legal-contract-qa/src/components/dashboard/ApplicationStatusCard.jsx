const STATUS_CONFIG = {
  connected: { dot: 'bg-success', label: 'Connected' },
  available: { dot: 'bg-success', label: 'Available' },
  ready: { dot: 'bg-success', label: 'Ready' },
  checking: { dot: 'bg-warning', label: 'Checking...' },
  unavailable: { dot: 'bg-error', label: 'Unavailable' },
};

export default function ApplicationStatusCard({ icon: Icon, label, status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted shrink-0" />
        <span className="text-sm text-muted">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className="text-xs font-medium text-text">{config.label}</span>
      </div>
    </div>
  );
}
