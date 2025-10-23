import SetPasswordForm from '@/components/auth/SetPasswordForm';
import { AuthService } from '@/services/auth.service';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Set Password | Karmi',
};

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token: string }> }) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return redirect('/');
  }

  try {
    await AuthService.checkPasswordResetStatus(token);
  } catch (error) {
    return redirect('/');
  }

  return <SetPasswordForm token={token} />;
}
