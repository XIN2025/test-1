import RegisterForm from '@/components/auth/register/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - Karmi',
  description: 'Register to your account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
