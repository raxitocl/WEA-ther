import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword, verifyTotpCode, generateSessionToken, signToken, verifyToken, timingSafeEqual } from '../auth-utils';

const settingsPath = path.join(process.cwd(), 'settings.json');

export async function GET(request: Request) {
  try {
    let settingsExists = false;
    try {
      await fs.access(settingsPath);
      settingsExists = true;
    } catch {}

    if (!settingsExists) {
      return NextResponse.json({ initialized: false, authenticated: false });
    }

    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    const isInitialized = !!(settings.security?.enabled && settings.security?.passwordHash);

    // Verify session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/wea_ther_session=([^;]+)/);
    const signedToken = match ? decodeURIComponent(match[1]) : null;

    let isAuthenticated = false;
    if (signedToken) {
      const verified = verifyToken(signedToken);
      if (verified) {
        isAuthenticated = true;
      }
    }

    return NextResponse.json({
      initialized: isInitialized,
      authenticated: isAuthenticated,
      twoFactorEnabled: !!settings.security?.twoFactorEnabled
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.security?.enabled || !settings.security?.passwordHash) {
      return NextResponse.json({ error: 'La seguridad no está configurada aún', initialized: false }, { status: 400 });
    }

    const { password, code } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    // Verify password
    const { salt, passwordHash } = settings.security;
    const { hash } = hashPassword(password, salt);

    if (!timingSafeEqual(hash, passwordHash)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Verify 2FA code if enabled
    if (settings.security.twoFactorEnabled) {
      if (!code) {
        return NextResponse.json({ error: 'Se requiere el código de verificación 2FA' }, { status: 400 });
      }
      const twoFactorSecret = settings.security.twoFactorSecret;
      if (!twoFactorSecret || !verifyTotpCode(twoFactorSecret, code)) {
        return NextResponse.json({ error: 'Código 2FA incorrecto o expirado' }, { status: 401 });
      }
    }

    // Create session cookie
    const token = generateSessionToken();
    const signedToken = signToken(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'wea_ther_session',
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Fallo al autenticar: ' + error.message }, { status: 500 });
  }
}
