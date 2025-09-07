import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Chỉ áp dụng middleware cho các route cần authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Client-side sẽ handle authentication với Firebase
    // Middleware chỉ để redirect basic cases
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
