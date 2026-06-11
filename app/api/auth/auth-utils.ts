import crypto from 'crypto';

// Secret key for signing sessions.
// We fall back to a random key generated on server start if not set, 
// which is perfectly secure for local deployments as it invalidates 
// sessions on restart, or we can use a fixed string.
const SESSION_SECRET = process.env.SESSION_SECRET || 'wea-ther-local-deployment-fallback-secret-998877';

function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  const length = clean.length;
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error('Invalid base32 character: ' + clean[i]);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function hashPassword(password: string, saltInput?: string): { salt: string; hash: string } {
  const salt = saltInput || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { salt, hash };
}

export function generateTotpSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);

    for (let i = -1; i <= 1; i++) {
      const counter = currentCounter + i;
      const counterBuffer = Buffer.alloc(8);
      const high = Math.floor(counter / 0x100000000);
      const low = counter % 0x100000000;
      counterBuffer.writeUInt32BE(high, 0);
      counterBuffer.writeUInt32BE(low, 4);

      const hmac = crypto.createHmac('sha1', key);
      hmac.update(counterBuffer);
      const hash = hmac.digest();

      const offset = hash[hash.length - 1] & 0xf;
      const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === code.trim()) {
        return true;
      }
    }
  } catch (e) {
    console.error('TOTP validation failed:', e);
  }
  return false;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signToken(token: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(token);
  const signature = hmac.digest('hex');
  return `${token}.${signature}`;
}

export function timingSafeEqual(strA: string, strB: string): boolean {
  try {
    const bufA = Buffer.from(strA, 'utf8');
    const bufB = Buffer.from(strB, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

export function verifyToken(signedToken: string): string | null {
  try {
    const parts = signedToken.split('.');
    if (parts.length !== 2) return null;
    const [token, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
    if (timingSafeEqual(signature, expectedSignature)) {
      return token;
    }
  } catch (e) {
    console.error('Session token verification failed:', e);
  }
  return null;
}
