import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const credentialsAuthProvider = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    otp: { label: 'OTP', type: 'text' },
  },
  async authorize(credentials) {
    try {
      if (!credentials?.email || !credentials?.otp) {
        throw new Error('Email and password required');
      }

      // TODO: Implement OTP verification

      throw new Error('Invalid credentials');
    } catch (error) {
      throw new Error((error as Error)?.message || 'Invalid credentials');
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
};
