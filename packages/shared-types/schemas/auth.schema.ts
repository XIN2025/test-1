import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password is required and must be at least 6 characters'),
});

export const RegisterEmailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
});

export const SetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Password reset token is missing'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
