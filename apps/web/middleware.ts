import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname, search } = req.nextUrl;

    if (pathname.startsWith('/auth/set-password')) {
      return NextResponse.next();
    }

    if (token && pathname.startsWith('/auth/complete-profile')) {
      return NextResponse.next();
    }

    if (token && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!token && pathname.startsWith('/auth')) {
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/auth/login',
    },
    callbacks: {
      authorized: () => true,
    },
  }
);
export const config = {
  // Protect everything EXCEPT public and static routes
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
