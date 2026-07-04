import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { loginSchema } from '../utils/validators';

export default function Login() {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast.success('Welcome back! Redirecting to dashboard...');
            setTimeout(() => (window.location.href = '/dashboard'), 1000);
        } catch {
            toast.error('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(`Continuing with ${provider}...`);
        } catch {
            toast.error(`Could not sign in with ${provider}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <Input
                    label="Password"
                    icon={Lock}
                    type="password"
                    passwordToggle
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border bg-card accent-primary"
                            {...register('rememberMe')}
                        />
                        <span className="text-sm text-muted">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-primary hover:text-accent transition-colors">
                        Forgot password?
                    </a>
                </div>

                <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
                    Sign In
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
                    onClick={() => handleSocialLogin('GitHub')}
                    disabled={loading}
                >
                    Continue with GitHub
                </Button>
            </form>

            <p className="text-center text-sm text-muted mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-semibold hover:text-accent transition-colors">
                    Create Account
                </Link>
            </p>
        </AuthLayout>
    );
}