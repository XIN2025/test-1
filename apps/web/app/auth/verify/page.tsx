import VerifyForm from '@/components/auth/VerifyForm';
import { AuthService } from '@/services/auth.service';
import { notFound } from 'next/navigation';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token: string }> }) {
  const params = await searchParams;
  const token = params.token;
  let redirectUrl: string | null = null;

  if (!token) {
    return notFound();
  }

  try {
    const resp = await AuthService.verifyEmail(token);
    redirectUrl = resp.redirectUrl;
  } catch (error) {
    throw error;
  }

  return <VerifyForm redirectUrl={redirectUrl} />;
}
