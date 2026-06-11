import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { hashPassword, generateTotpSecret, verifyTotpCode, generateSessionToken, signToken, verifyToken, timingSafeEqual } from '../auth-utils';

const settingsPath = path.join(process.cwd(), 'settings.json');

export async function GET(request: Request) {
  try {
    // Read settings to check if already initialized
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/wea_ther_session=([^;]+)/);
    const signedToken = match ? decodeURIComponent(match[1]) : null;
    const isAuthorized = signedToken ? verifyToken(signedToken) : false;

    if (settings.security?.enabled && !isAuthorized) {
      return NextResponse.json({ error: 'La seguridad ya está inicializada y no autorizado' }, { status: 400 });
    }

    const secret = generateTotpSecret();
    // Use QR code generator API (qrserver) to avoid bundling heavy local dependencies
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `otpauth://totp/WEA-ther:Admin?secret=${secret}&issuer=WEA-ther`
    )}`;

    return NextResponse.json({ secret, qrUrl });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al inicializar: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/wea_ther_session=([^;]+)/);
    const signedToken = match ? decodeURIComponent(match[1]) : null;
    const isAuthorized = signedToken ? verifyToken(signedToken) : false;

    const isInitialSetup = !settings.security?.passwordHash;

    const { password, twoFactorEnabled, twoFactorSecret, code, currentPassword } = await request.json();

    if (settings.security?.enabled) {
      if (!isAuthorized) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      // Verify current password first if they are changing security settings
      if (currentPassword) {
        const { salt, passwordHash } = settings.security;
        const { hash } = hashPassword(currentPassword, salt);
        if (!timingSafeEqual(hash, passwordHash)) {
          return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Se requiere la contraseña actual para aplicar cambios de seguridad' }, { status: 400 });
      }
    } else {
      // First setup requires password
      if (!password || password.length < 4) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
      }
    }

    // Now, handle updating or setting new settings
    let finalPasswordHash = settings.security?.passwordHash;
    let finalSalt = settings.security?.salt;

    if (password) {
      if (password.length < 4) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
      }
      const { salt, hash } = hashPassword(password);
      finalPasswordHash = hash;
      finalSalt = salt;
    }

    let finalTwoFactorSecret = settings.security?.twoFactorSecret;
    let finalTwoFactorEnabled = !!settings.security?.twoFactorEnabled;

    if (twoFactorEnabled !== undefined) {
      if (twoFactorEnabled && !settings.security?.twoFactorEnabled) {
        // Enforcing 2FA for the first time
        if (!twoFactorSecret || !code) {
          return NextResponse.json({ error: 'Se requiere la clave secreta 2FA y el código de verificación' }, { status: 400 });
        }
        const verified = verifyTotpCode(twoFactorSecret, code);
        if (!verified) {
          return NextResponse.json({ error: 'Código 2FA incorrecto. Por favor, vuelve a escanear el QR' }, { status: 400 });
        }
        finalTwoFactorSecret = twoFactorSecret;
        finalTwoFactorEnabled = true;
      } else if (!twoFactorEnabled && settings.security?.twoFactorEnabled) {
        // Disabling 2FA
        if (!code) {
          return NextResponse.json({ error: 'Se requiere el código de verificación 2FA para desactivar' }, { status: 400 });
        }
        const verified = verifyTotpCode(settings.security.twoFactorSecret, code);
        if (!verified) {
          return NextResponse.json({ error: 'Código 2FA incorrecto' }, { status: 400 });
        }
        finalTwoFactorSecret = undefined;
        finalTwoFactorEnabled = false;
      }
    }

    settings.security = {
      enabled: true,
      passwordHash: finalPasswordHash,
      salt: finalSalt,
      twoFactorEnabled: finalTwoFactorEnabled,
      twoFactorSecret: finalTwoFactorSecret
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    // On initial setup, log them in immediately by setting cookie
    if (isInitialSetup) {
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
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Fallo al guardar configuración de seguridad: ' + error.message }, { status: 500 });
  }
}
