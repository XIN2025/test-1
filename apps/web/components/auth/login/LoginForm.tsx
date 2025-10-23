'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { LoginSchema } from '@repo/shared-types/schemas/auth.schema';
import { LoginInput } from '@repo/shared-types/types/auth.type';
import CardLayout from '../CardLayout';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { signIn } from 'next-auth/react';
import { icons } from '@/components/icons';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import LoadingButton from '@/components/general/LoadingButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsPending(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Login successful');
        router.push('/');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <CardLayout
      title='Welcome To Karmi'
      titleClassName='text-4xl font-bold text-gray-500'
      description='Your planet awaits'
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-10'>
          <div className='space-y-6'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input id='email' type='email' {...field} placeholder='you@example.com' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
          <div className='space-y-6'>
            <div className='relative flex items-center justify-center'>
              <div className='h-[1px] w-full bg-gray-300'></div>
              <span className='absolute bg-white px-3 text-sm text-gray-500'>OR</span>
            </div>

            {/* Google Login */}
            <div className='flex items-center justify-center'>
              <Button
                type='button'
                variant='outline'
                onClick={() => signIn('google')}
                className='flex flex-1 items-center justify-center gap-2'
              >
                {icons.google}
                Continue with Google
              </Button>
            </div>
          </div>
          <div className='space-y-2 text-center'>
            <LoadingButton isLoading={isPending} type='submit' className='w-full'>
              Sign in
            </LoadingButton>
            <span className='text-muted-foreground text-sm'>
              Don't have an account?{' '}
              <Link href='/auth/register' className='text-primary font-medium hover:underline'>
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </Form>
    </CardLayout>
  );
}
