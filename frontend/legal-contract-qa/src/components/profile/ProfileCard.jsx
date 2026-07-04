import { User, BadgeCheck } from 'lucide-react';

function getInitials(name) {
  if (!name) return null;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileCard({ user }) {
  const initials = getInitials(user?.name);
  const isActive = user?.accountStatus !== 'suspended' && user?.accountStatus !== 'inactive';

  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
          {initials ? (
            <span className="text-2xl font-bold text-white">{initials}</span>
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        {user?.emailVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-success border-2 border-bg flex items-center justify-center">
            <BadgeCheck className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      {user?.name && (
        <h2 className="text-xl font-bold text-text mb-1">{user.name}</h2>
      )}
      {user?.email && (
        <p className="text-sm text-muted mb-3">{user.email}</p>
      )}
      <div className="flex items-center justify-center gap-2">
        {user?.role && (
          <span className="inline-block text-xs px-3 py-1 rounded-full bg-primary-light text-primary font-medium">
            {user.role}
          </span>
        )}
        {user?.accountStatus && (
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
              isActive
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'
            }`}
          >
            {user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)}
          </span>
        )}
      </div>
    </div>
  );
}
