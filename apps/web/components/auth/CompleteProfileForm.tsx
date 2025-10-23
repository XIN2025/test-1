'use client';
import React, { useState } from 'react';
import CardLayout from '../auth/CardLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileInput } from '@repo/shared-types/types';
import { useForm } from 'react-hook-form';
import { ProfileSchema } from '@repo/shared-types/schemas';
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { GenderEnum } from '@repo/shared-types/enums/auth.enum';
import { enumToText } from '@repo/shared-types/utils';
import { useCreateProfile } from '@/queries/profile';
import { useRouter } from 'next/navigation';
import LoadingButton from '../general/LoadingButton';
import ProfileLoader from './ProfileLoader';

const CompleteProfileForm = () => {
  const { mutate: createProfile, isPending: isCreatingProfile } = useCreateProfile();
  const [showProfileLoader, setShowProfileLoader] = useState(false);
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: '',
      gender: '',
    },
  });

  const onSubmit = (data: ProfileInput) => {
    createProfile(data, {
      onSuccess: () => {
        setShowProfileLoader(true);
      },
    });
  };

  if (showProfileLoader) {
    const duration = Math.floor(Math.random() * 5) + 5;
    return <ProfileLoader duration={duration} onComplete={() => router.push('/')} />;
  }

  return (
    <CardLayout title='Enter your birth details' description="Let's get started with your cosmic journey">
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
              <FormItem>
                <FormLabel htmlFor='gender'>Gender</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
    </CardLayout>
  );
};

export default CompleteProfileForm;
