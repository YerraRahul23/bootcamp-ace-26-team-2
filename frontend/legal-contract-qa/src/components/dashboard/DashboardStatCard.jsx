export default function DashboardStatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-text">
        {value !== null && value !== undefined ? value : '--'}
      </p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
