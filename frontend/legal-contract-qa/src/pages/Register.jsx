import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { registerSchema } from '../utils/validators';

function PasswordStrength({ password }) {
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-error', textColor: 'text-error' };
        if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-warning', textColor: 'text-warning' };
        if (score <= 4) return { level: 3, label: 'Good', color: 'bg-warning', textColor: 'text-warning' };
        return { level: 4, label: 'Strong', color: 'bg-success', textColor: 'text-success' };
    };

    if (!password) return null;
    const strength = getStrength();

    return (
        <div className="space-y-1 mt-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-card'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs ${strength.textColor}`}>{strength.label}</p>
        </div>
    );
}

export default function Register() {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            toast.success('Account created! Redirecting to dashboard...');
            setTimeout(() => (window.location.href = '/dashboard'), 1500);
        } catch {
            toast.error('Could not create your account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialRegister = async (provider) => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(`Continuing with ${provider}...`);
        } catch {
            toast.error(`Could not sign up with ${provider}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Create your account" subtitle="Start your journey with ContractAI">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    label="Full Name"
                    icon={User}
                    type="text"
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name')}
                />

                <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <div>
                    <Input
                        label="Password"
                        icon={Lock}
                        type="password"
                        passwordToggle
                        placeholder="Create a strong password"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <PasswordStrength password={password} />
                </div>

                <Input
                    label="Confirm Password"
                    icon={Lock}
                    type="password"
                    passwordToggle
                    placeholder="Repeat your password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 rounded border-border bg-card accent-primary"
                        {...register('acceptTerms')}
                    />
                    <span className="text-sm text-muted">
                        I agree to the <a href="#" className="text-primary hover:text-accent">Terms of Service</a> and{' '}
                        <a href="#" className="text-primary hover:text-accent">Privacy Policy</a>
                    </span>
                </label>
                {errors.acceptTerms && (
                    <p className="text-xs text-error -mt-3">{errors.acceptTerms.message}</p>
                )}

                <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
                    Create Account
                </Button>

                <div className="relative flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted">or continue with</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                    type="button"
                    variant="social"
                    icon={Code2}
                    onClick={() => handleSocialRegister('GitHub')}
                    disabled={loading}
                >
                    Continue with GitHub
                </Button>
            </form>

            <p className="text-center text-sm text-muted mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}