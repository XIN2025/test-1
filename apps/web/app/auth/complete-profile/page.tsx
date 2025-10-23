import CompleteProfileForm from '@/components/profile/CompleteProfileForm';
import { AuthService } from '@/services';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Complete Profile | Karmi',
  description: 'Complete your profile to get started',
};

export default async function CompleteProfilePage() {
  try {
    const resp = await AuthService.me();
    if (resp.redirectUrl?.includes('/auth/complete-profile')) {
      return <CompleteProfileForm />;
    }
    return redirect('/');
  } catch (error) {
    return redirect('/');
  }
}
