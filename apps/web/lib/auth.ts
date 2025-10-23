import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { AuthOptions } from 'next-auth';
import { AuthService } from '@/services';
import { envConfig } from '@/config';

const credentialsProvider = CredentialsProvider({
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'text' },
    password: { label: 'Password', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    try {
      const resp = await AuthService.loginEmail({
        email: credentials.email,
        password: credentials.password,
      });

      return {
        id: resp?.id,
        email: resp?.email,
        name: resp?.name,
        token: resp?.token,
      };
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  },
});

const googleAuthProvider = GoogleProvider({
  clientId: envConfig.providers.google.clientId,
  clientSecret: envConfig.providers.google.clientSecret,
});

export const authOptions: AuthOptions = {
  providers: [credentialsProvider, googleAuthProvider],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = profile?.email;

        if (email && account.id_token) {
          try {
            const resp = await AuthService.loginGoogle(account.id_token);
            if (resp) {
              user.id = resp.id;
              user.name = resp.name;
              user.email = resp.email;
              user.token = resp.token;
            }
          } catch (error) {
            console.error('Error signing in:', error);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.token = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
};
