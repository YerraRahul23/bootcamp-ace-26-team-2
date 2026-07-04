const styles = {
  indexed: 'text-success bg-success/10',
  processing: 'text-warning bg-warning/10',
  failed: 'text-error bg-error/10',
};

export default function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  const className = styles[status] || 'text-muted bg-card-hover';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
