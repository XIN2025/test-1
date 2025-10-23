import LoginForm from '@/components/auth/login/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Karmi',
  description: 'Login to your account',
};

export default function LoginPage() {
  return <LoginForm />;
}
