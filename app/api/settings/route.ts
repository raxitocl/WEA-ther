import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyToken } from '../auth/auth-utils';

export const dynamic = 'force-dynamic';

const settingsPath = path.join(process.cwd(), 'settings.json');
const localMusicDir = path.join(process.cwd(), 'public', 'music');
const localImagesDir = path.join(process.cwd(), 'public', 'images');

async function checkAuth(request: Request): Promise<boolean> {
  try {
    let settingsExists = false;
    try {
      await fs.access(settingsPath);
      settingsExists = true;
    } catch {}

    if (!settingsExists) {
      return true; // If no settings file, allow setup
    }

    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);

    // If security is not enabled, allow access
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
    console.error('Error checking authentication in settings api:', e);
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
    
    // Scan local public/music directory for MP3 files
    let localMusicFiles: string[] = [];
    try {
      await fs.mkdir(localMusicDir, { recursive: true });
      const files = await fs.readdir(localMusicDir);
      localMusicFiles = files.filter(f => f.toLowerCase().endsWith('.mp3'));
    } catch (err) {
      console.error("Error scanning public/music directory:", err);
    }

    // Scan local public/images directory for slideshow images
    let localSlideshowFiles: string[] = [];
    try {
      await fs.mkdir(localImagesDir, { recursive: true });
      const files = await fs.readdir(localImagesDir);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      localSlideshowFiles = files.filter(f => 
        validExtensions.some(ext => f.toLowerCase().endsWith(ext))
      );
    } catch (err) {
      console.error("Error scanning public/images directory:", err);
    }
    
    return NextResponse.json({
      ...settings,
      localMusicFiles,
      localSlideshowFiles
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Settings file not found or corrupted: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const newSettings = await request.json();
    
    // Quick validation
    if (!newSettings.mainCity || !newSettings.unitSystem) {
      return NextResponse.json({ error: 'Invalid settings configuration' }, { status: 400 });
    }
    
    // Strip localMusicFiles and localSlideshowFiles dynamic lists if frontend submitted them back
    const { localMusicFiles, localSlideshowFiles, ...settingsToSave } = newSettings;
    
    await fs.writeFile(settingsPath, JSON.stringify(settingsToSave, null, 2), 'utf8');
    return NextResponse.json({ success: true, settings: settingsToSave });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save settings: ' + error.message }, { status: 500 });
  }
}
