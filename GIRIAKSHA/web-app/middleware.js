import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Paths accessible without auth
    const publicPaths = ['/login', '/register', '/register/site-admin', '/register/gov'];

    // Check if accessing a public path
    if (publicPaths.some(path => pathname.startsWith(path))) {
        // If logged in, redirect to dashboard
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Check if accessing protected path
    if (pathname.startsWith('/dashboard')) {
        // If not logged in, redirect to login
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register/:path*'],
};
