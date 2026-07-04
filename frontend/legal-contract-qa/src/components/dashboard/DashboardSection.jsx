export default function DashboardSection({ title, children, className = '' }) {
  return (
    <div className={`glass rounded-2xl overflow-hidden ${className}`}>
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
