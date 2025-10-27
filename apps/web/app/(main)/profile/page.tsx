import ProfileSection from '@/components/profile/ProfileSection';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Profile | Karmi',
  description: 'Manage your profile information',
};

const ProfilePage = () => {
  return <ProfileSection />;
};

export default ProfilePage;
