import ProfileLoader from '@/components/auth/ProfileLoader';
import ProfileSection from '@/components/profile/ProfileSection';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Profile | Karmi',
  description: 'Manage your profile information',
};

const ProfilePage = () => {
  return <ProfileLoader />;
};

export default ProfilePage;
