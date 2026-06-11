import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear cookie
  response.cookies.set({
    name: 'wea_ther_session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  return response;
}
