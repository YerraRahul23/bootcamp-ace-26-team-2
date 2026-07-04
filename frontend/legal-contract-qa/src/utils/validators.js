import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});