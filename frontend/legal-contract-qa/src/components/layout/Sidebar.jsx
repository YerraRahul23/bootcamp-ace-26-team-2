import { Link, NavLink } from 'react-router-dom';
import {
  Scale,
  LayoutDashboard,
  FileText,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat Assistant' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-bg border-r border-border
        flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        onClick={onClose}
        className="h-16 flex items-center gap-2.5 px-6 border-b border-border group shrink-0"
      >
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-text">
          Contract<span className="gradient-text">AI</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-muted hover:text-text hover:bg-card-hover'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={() => {
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-muted hover:text-error hover:bg-error/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
