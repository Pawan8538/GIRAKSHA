import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL('/dashboard', request.url);
  const response = NextResponse.redirect(url);
  
  response.cookies.set('token', 'demo_dev_token_giraksha', { path: '/', maxAge: 86400 });
  response.cookies.set(
    'user',
    JSON.stringify({
      id: 'gov_1',
      name: 'Dr. K. Ramanathan (Director)',
      phone: '9876543210',
      role: 'gov_authority',
      role_name: 'gov_authority',
      department: 'Directorate General of Mines Safety (DGMS)',
    }),
    { path: '/', maxAge: 86400 }
  );
  
  return response;
}
