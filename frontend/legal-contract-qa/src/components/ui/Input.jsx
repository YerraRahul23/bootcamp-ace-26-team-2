import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
    label,
    icon: Icon,
    error,
    type = 'text',
    passwordToggle = false,
    className = '',
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    type={inputType}
                    className={`
            w-full bg-card border border-border rounded-xl px-4 py-3
            text-text placeholder:text-muted-dark
            transition-all duration-200 outline-none
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-glow
            ${Icon ? 'pl-12' : ''}
            ${isPassword && passwordToggle ? 'pr-12' : ''}
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `}
                    {...props}
                />
                {isPassword && passwordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs text-error flex items-center gap-1 mt-1" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}