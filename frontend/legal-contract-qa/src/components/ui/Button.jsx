import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
    primary:
        'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5',
    outline:
        'glass glass-hover text-text border-border hover:border-primary/50 hover:text-primary',
    ghost:
        'text-muted hover:text-text hover:bg-glass',
    social:
        'glass glass-hover text-muted hover:text-text w-full justify-center',
};

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
    xl: 'px-10 py-4 text-lg',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    type = 'button',
    ...props
}) {
    return (
        <motion.button
            type={type}
            disabled={disabled || loading}
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            className={`
        inline-flex items-center gap-2 font-semibold rounded-full
        transition-all duration-250 relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!loading && Icon && <Icon className="w-4 h-4" />}
            <span className={loading ? 'opacity-0' : ''}>{children}</span>
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </span>
            )}
        </motion.button>
    );
}