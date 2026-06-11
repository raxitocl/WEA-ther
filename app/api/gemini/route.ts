import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { verifyToken } from '../auth/auth-utils';

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
    console.error('Gemini checkAuth failed:', e);
  }
  return false;
}

export async function getActiveAccessToken(settings: any): Promise<string> {
  const auth = settings.geminiAuth;
  if (!auth) throw new Error('Autenticación de Gemini no configurada');

  if (auth.method === 'api-key') {
    if (!auth.apiKey) throw new Error('API Key de Gemini no configurada');
    return auth.apiKey;
  }

  // OAuth method
  if (!auth.refreshToken) throw new Error('No has iniciado sesión con Google');

  // Check if current access token is still valid (with 60s buffer)
  if (auth.accessToken && auth.tokenExpiry && auth.tokenExpiry > Date.now() + 60000) {
    return auth.accessToken;
  }

  // Refresh access token using Google refresh endpoint
  console.log('Google OAuth access token expired, renewing using refresh_token...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      refresh_token: auth.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('Error al refrescar el token de Google: ' + text);
  }

  const data = await res.json();
  const newAccessToken = data.access_token;
  const newExpiry = Date.now() + (data.expires_in * 1000);

  // Update settings.json in the background
  try {
    const freshSettingsData = await fs.readFile(settingsPath, 'utf8');
    const freshSettings = JSON.parse(freshSettingsData);
    freshSettings.geminiAuth = {
      ...freshSettings.geminiAuth,
      accessToken: newAccessToken,
      tokenExpiry: newExpiry
    };
    await fs.writeFile(settingsPath, JSON.stringify(freshSettings, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update refreshed access token in settings.json:', err);
  }

  // Update active config references in memory
  auth.accessToken = newAccessToken;
  auth.tokenExpiry = newExpiry;

  return newAccessToken;
}

export async function callGeminiRaw(prompt: string, htmlContent?: string, apiKeyOrToken?: string, method?: 'api-key' | 'oauth') {
  let activeToken = apiKeyOrToken;
  let activeMethod = method;

  if (!activeToken) {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);
    activeToken = await getActiveAccessToken(settings);
    activeMethod = settings.geminiAuth?.method || 'api-key';
  }

  const systemInstruction = 
    "Eres un extractor de datos e información estructurada de páginas web HTML. " +
    "Analiza el contenido provisto y extrae la información solicitada de forma precisa. " +
    "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. No agregues explicaciones, introducciones, ni bloques de código (```json ... ```).";

  const contents = [
    {
      parts: [
        { text: prompt },
        ...(htmlContent ? [{ text: `CONTENIDO DE LA PÁGINA WEB:\n\n${htmlContent}` }] : [])
      ]
    }
  ];

  let url = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (activeMethod === 'oauth') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    headers['Authorization'] = `Bearer ${activeToken}`;
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API de Gemini falló: ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

export async function scrapeAndCleanHtml(url: string, selector?: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Error al descargar la página web: HTTP ${res.status}`);
  }

  let html = await res.text();

  // Strip scripts, styles, SVGs, canvas, iframes, images to save tokens
  html = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  if (selector) {
    const cleanSelector = selector.trim();
    if (cleanSelector.startsWith('#')) {
      const id = cleanSelector.substring(1);
      const regex = new RegExp(`<[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/`, 'i');
      const match = html.match(regex);
      if (match) html = match[0] + '...';
    } else if (cleanSelector.startsWith('.')) {
      const className = cleanSelector.substring(1);
      const regex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/`, 'i');
      const match = html.match(regex);
      if (match) html = match[0] + '...';
    } else {
      // Basic tag matching
      const regex = new RegExp(`<${cleanSelector}[^>]*>([\\s\\S]*?)<\\/${cleanSelector}>`, 'i');
      const match = html.match(regex);
      if (match) html = match[0];
    }
  }

  // Truncate to avoid exceeding input token limits
  if (html.length > 80000) {
    html = html.substring(0, 80000) + '\n...[Contenido truncado por longitud]';
  }

  return html;
}

// POST endpoint for testing scraper configuration interactively from the Admin page
export async function POST(request: Request) {
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { url, cssSelector, prompt } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Se requiere una URL para el scraping' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Se requiere un prompt para el modelo Gemini' }, { status: 400 });
    }

    // Scrape HTML
    console.log(`Testing scraper: Fetching content from ${url}...`);
    let html = '';
    try {
      html = await scrapeAndCleanHtml(url, cssSelector);
    } catch (e: any) {
      return NextResponse.json({ error: `Fallo al descargar la página web: ${e.message}` }, { status: 400 });
    }

    // Call Gemini
    console.log('Testing scraper: Sending request to Gemini AI...');
    const result = await callGeminiRaw(prompt, html);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Failed testing scraper:', error);
    return NextResponse.json({ error: `Fallo al procesar con Gemini AI: ${error.message}` }, { status: 500 });
  }
}
