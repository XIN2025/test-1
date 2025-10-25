'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@repo/ui/components/card';
import { signOut } from 'next-auth/react';
import { CustomAlertDialog } from '../general/CustomAlertDialog';
import { useDeleteUserProfile } from '@/queries/profile';

const SettingsCard = () => {
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const { mutate: deleteUserProfile, isPending: isDeletingUserProfile } = useDeleteUserProfile();

  const handleDeleteAccount = () => {
    deleteUserProfile(undefined, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setShowLogoutAlert(false);
    setShowDeleteAccountAlert(false);
  };

  const handleLogout = () => {
    handleClose();
    signOut({
      callbackUrl: '/auth/login',
    });
  };
  return (
    <>
      <Card className='mx-auto w-full'>
        <CardContent className='text-muted-foreground cursor-pointer space-y-3 text-sm font-medium'>
          <div className='hover:text-foreground flex items-center justify-between'>
            <p>Help & Support</p>
            <ChevronRight className='h-4 w-4' />
          </div>
          <div className='hover:text-foreground flex items-center justify-between'>
            <p>About App</p>
            <ChevronRight className='h-4 w-4' />
          </div>
          <div
            onClick={() => setShowLogoutAlert(true)}
            className='hover:text-foreground flex items-center justify-between'
          >
            <p>Logout</p>
            <ChevronRight className='h-4 w-4' />
          </div>
          <div
            onClick={() => setShowDeleteAccountAlert(true)}
            className='text-destructive hover:text-destructive/80 flex items-center justify-between'
          >
            <p>Delete Account</p>
            <ChevronRight className='h-4 w-4' />
          </div>
        </CardContent>
      </Card>
      <CustomAlertDialog
        isOpen={showLogoutAlert}
        onClose={() => setShowLogoutAlert(false)}
        onConfirm={handleLogout}
        title='Logout your account'
        description='Are you sure you want to logout? This will sign you out of your account and you will need to login again.'
        cancelText='Cancel'
        confirmText='Logout'
        confirmButtonClassName='bg-destructive hover:bg-destructive/80 text-white'
      />
      <CustomAlertDialog
        isOpen={showDeleteAccountAlert}
        onClose={() => setShowDeleteAccountAlert(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingUserProfile}
        title='Delete Account'
        description='Are you sure you want to delete your account? This will delete your account and all your data will be lost.'
        cancelText='Cancel'
        confirmText='Delete Account'
        confirmButtonClassName='bg-destructive hover:bg-destructive/80 text-white'
      />
    </>
  );
};

export default SettingsCard;
