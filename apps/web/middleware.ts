import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, origin, search } = req.nextUrl;

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
    const loginUrl = new URL('/auth/login', origin);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
export const config = {
  // Protect everything EXCEPT public and static routes
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
