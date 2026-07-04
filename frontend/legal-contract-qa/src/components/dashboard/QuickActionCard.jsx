import { useNavigate } from 'react-router-dom';

export default function QuickActionCard({ icon: Icon, title, description, to, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="glass rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 group"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-text mb-0.5">{title}</p>
      <p className="text-xs text-muted">{description}</p>
    </div>
  );
}
