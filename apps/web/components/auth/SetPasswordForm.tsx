'use client';
import React, { useEffect, useState } from 'react';
import CardLayout from './CardLayout';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SetPasswordSchema } from '@repo/shared-types/schemas/auth.schema';
import { SetPasswordInput } from '@repo/shared-types/types/auth.type';
import { Input } from '@repo/ui/components/input';
import LoadingButton from '../general/LoadingButton';
import { AuthService } from '@/services/auth.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SetPasswordForm = ({ token }: { token: string }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: {
      token: token,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    form.setValue('token', token);
  }, [form, token]);

  const onSubmit = async (data: SetPasswordInput) => {
    setIsPending(true);
    try {
      const resp = await AuthService.setPassword(data);
      if (resp) {
        toast.success('Password set successfully');
        router.push('/');
      } else {
        toast.error('Failed to set password');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <CardLayout
      title='Set Up Your Password'
      titleClassName='text-2xl font-semibold'
      description={`Secure your account by creating a password`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-10'>
          <div className='space-y-6'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input type={showPassword ? 'text' : 'password'} placeholder='••••••••' {...field} />
                      <button
                        type='button'
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className='absolute top-1/2 right-4 -translate-y-1/2'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeIcon className='size-4' /> : <EyeOffIcon className='size-4' />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Re-Enter Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input type={showConfirmPassword ? 'text' : 'password'} placeholder='••••••••' {...field} />
                      <button
                        type='button'
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className='absolute top-1/2 right-4 -translate-y-1/2'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeIcon className='size-4' /> : <EyeOffIcon className='size-4' />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='space-y-2 text-center'>
            <LoadingButton type='submit' className='w-full' isLoading={isPending}>
              Set Password
            </LoadingButton>
          </div>
        </form>
      </Form>
    </CardLayout>
  );
};

export default SetPasswordForm;
