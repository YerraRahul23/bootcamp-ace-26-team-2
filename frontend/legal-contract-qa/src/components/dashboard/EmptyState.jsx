export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted mb-6">{description}</p>
      {action}
    </div>
  );
}
