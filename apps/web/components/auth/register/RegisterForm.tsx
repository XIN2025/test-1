'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { RegisterEmailSchema } from '@repo/shared-types/schemas/auth.schema';
import { RegisterEmailInput } from '@repo/shared-types/types/auth.type';
import CardLayout from '../CardLayout';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { signIn } from 'next-auth/react';
import { icons } from '@/components/icons';
import LoadingButton from '@/components/general/LoadingButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/auth.service';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(15 * 60);
  const [resendTimer, setResendTimer] = useState(0);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setStep(1);
    }
  }, [timer]);

  useEffect(() => {
    if (step === 2) {
      setTimer(15 * 60);
    }
  }, [step]);

  const form = useForm<RegisterEmailInput>({
    resolver: zodResolver(RegisterEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RegisterEmailInput) => {
    setRegistering(true);
    try {
      const resp = await AuthService.registerEmail(data);
      if (resp) {
        setStep(2);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setRegistering(false);
    }
  };

  const handleResendEmail = () => {
    if (resendTimer > 0) return;
    const data = {
      email: form.getValues('email'),
    };
    onSubmit(data);
    setResendTimer(60);
    toast.success('Verification email sent successfully');
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleChangeEmail = () => {
    setStep(1);
    form.reset();
  };

  const formatTimer = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return step === 1 ? (
    <CardLayout
      title='Welcome To Karmi'
      titleClassName='text-4xl font-bold text-gray-500'
      description='Enter your email to signup'
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
            <LoadingButton type='submit' className='w-full' isLoading={registering}>
              Get Started
            </LoadingButton>
            <span className='text-muted-foreground text-sm'>
              Already have an account?{' '}
              <Link href='/auth/login' className='text-primary font-medium hover:underline'>
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </Form>
    </CardLayout>
  ) : (
    <CardLayout
      title='Verify Your Email'
      titleClassName='text-2xl font-semibold'
      description={`We've sent a verification email to ${form.getValues('email')}`}
    >
      <div className='space-y-8'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <div className='bg-foreground flex items-center justify-center rounded-full p-8'>{icons.send}</div>
          <p className='text-muted-foreground text-sm'>{formatTimer(timer)}</p>
        </div>

        <p className='text-center text-sm font-medium'>
          We’ve sent a verification link to your email. Please open it to confirm your account. If you don’t see it,
          check your spam or promotions folder.
        </p>

        <p className='text-muted-foreground text-center text-sm'>
          Didn’t receive the mail?{' '}
          <span
            onClick={handleResendEmail}
            className={cn(
              'text-primary cursor-pointer font-medium hover:underline',
              resendTimer > 0 ? 'cursor-not-allowed opacity-50' : ''
            )}
          >
            Send again {resendTimer > 0 ? `(${resendTimer})` : ''}
          </span>{' '}
          or{' '}
          <span onClick={handleChangeEmail} className='text-primary cursor-pointer font-medium hover:underline'>
            Change Email
          </span>
        </p>
      </div>
    </CardLayout>
  );
}
