import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyToken } from '../../auth-utils';

const settingsPath = path.join(process.cwd(), 'settings.json');

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${origin}/admin?auth=error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/admin?auth=error&message=No+code+provided`);
    }

    // Read settings
    const settingsData = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);

    // Verify session if security is enabled
    if (settings.security?.enabled) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/wea_ther_session=([^;]+)/);
      const signedToken = match ? decodeURIComponent(match[1]) : null;
      let isAuthorized = false;
      if (signedToken) {
        const verified = verifyToken(signedToken);
        if (verified) isAuthorized = true;
      }
      if (!isAuthorized) {
        return NextResponse.redirect(`${origin}/admin?auth=error&message=No+autorizado`);
      }
    }

    const clientId = settings.geminiAuth?.clientId;
    const clientSecret = settings.geminiAuth?.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/admin?auth=error&message=Credenciales+de+Google+no+encontradas`);
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Failed to exchange Google OAuth code:', errText);
      return NextResponse.redirect(`${origin}/admin?auth=error&message=Exchange+failed`);
    }

    const tokenData = await tokenResponse.json();

    settings.geminiAuth = {
      ...settings.geminiAuth,
      method: 'oauth',
      refreshToken: tokenData.refresh_token || settings.geminiAuth?.refreshToken,
      // We temporarily save access token and calculate expiry time
      accessToken: tokenData.access_token,
      tokenExpiry: Date.now() + (tokenData.expires_in * 1000)
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    return NextResponse.redirect(`${origin}/admin?auth=success`);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return new NextResponse('Internal Server Error in Google Auth: ' + err.message, { status: 500 });
  }
}
