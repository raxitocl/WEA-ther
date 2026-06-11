import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyToken } from '../auth-utils';

const settingsPath = path.join(process.cwd(), 'settings.json');

async function checkAuth(request: Request): Promise<boolean> {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.security?.enabled) {
      return true;
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/wea_ther_session=([^;]+)/);
    const signedToken = match ? decodeURIComponent(match[1]) : null;

    if (signedToken) {
      const verified = verifyToken(signedToken);
      if (verified) return true;
    }
  } catch (e) {
    console.error('OAuth start checkAuth failed:', e);
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    const clientId = settings.geminiAuth?.clientId;
    if (!clientId) {
      return new NextResponse('Google OAuth Client ID no configurado en los proveedores.', { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/generative-language')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.redirect(authorizationUrl);
  } catch (error: any) {
    return new NextResponse('Error al iniciar OAuth: ' + error.message, { status: 500 });
  }
}
