'use client';
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Select } from '@repo/ui/components/select';
import { SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/components/select';
import { GenderEnum } from '@repo/shared-types/enums/auth.enum';
import { enumToText, getInitials } from '@repo/shared-types/utils';
import LoadingButton from '../general/LoadingButton';
import { ProfileSchema } from '@repo/shared-types/schemas/profile.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileInput } from '@repo/shared-types/types';
import { useCreateProfile, useGetProfile } from '@/queries/profile';
import { useForm } from 'react-hook-form';
import { DataLoader } from '../general/DataLoader';
import SettingsCard from './SettingsCard';
import KarmiPointsCard from './KarmiPointsCard';
import KarmiPremiumCard from './KarmiPremiumCard';

const ProfileSection = () => {
  const { data: profileData, isLoading: isLoadingProfile } = useGetProfile();
  const { mutate: createProfile, isPending: isCreatingProfile } = useCreateProfile();

  const getDefaultValues = () => {
    return {
      name: profileData?.user?.name || '',
      gender: profileData?.gender || '',
      dateOfBirth: profileData?.dateOfBirth ? new Date(profileData?.dateOfBirth).toISOString().split('T')[0] : '',
      timeOfBirth: profileData?.timeOfBirth || '',
      placeOfBirth: profileData?.placeOfBirth || '',
    };
  };

  const form = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: getDefaultValues(),
  });
  const onSubmit = (data: ProfileInput) => {
    createProfile(data);
  };

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [profileData, form]);

  return (
    <div className='container mx-auto flex flex-col items-center justify-center space-y-4 p-4 sm:p-6'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold'>Your Profile</h1>
        <p className='text-muted-foreground text-sm'>Manage your profile information and preferences</p>
      </div>
      <div className='flex w-full flex-col gap-4 md:flex-row'>
        <div className='flex w-full justify-center md:w-2/3'>
          {isLoadingProfile ? (
            <DataLoader message='Loading profile...' />
          ) : (
            <Card className='w-full'>
              <CardHeader className='flex flex-col items-center justify-center'>
                <Avatar className='size-20'>
                  <AvatarFallback>{getInitials(profileData?.user?.name || '')}</AvatarFallback>
                </Avatar>
                <CardTitle>{profileData?.user?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='name'>Name</FormLabel>
                          <FormControl>
                            <Input id='name' {...field} placeholder='Enter your name' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='gender'
                      render={({ field }) => (
                        <FormItem key={field.value}>
                          <FormLabel htmlFor='gender'>Gender</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select your gender' />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(GenderEnum).map((gender) => (
                                  <SelectItem key={gender} value={gender}>
                                    {enumToText(gender)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='dateOfBirth'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='dateOfBirth'>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type='date' id='dateOfBirth' {...field} placeholder='Enter your date of birth' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='timeOfBirth'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='timeOfBirth'>Time of Birth</FormLabel>
                          <FormControl>
                            <Input type='time' id='timeOfBirth' {...field} placeholder='Enter your time of birth' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='placeOfBirth'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='placeOfBirth'>Place of Birth</FormLabel>
                          <FormControl>
                            <Input id='placeOfBirth' {...field} placeholder='Enter your place of birth' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='space-y-2 text-center'>
                      <LoadingButton type='submit' className='w-full' isLoading={isCreatingProfile}>
                        Complete Profile
                      </LoadingButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
        <div className='flex w-full flex-col gap-4 md:w-1/3'>
          <KarmiPointsCard />
          <KarmiPremiumCard />
          <SettingsCard />
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
