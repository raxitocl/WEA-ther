'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CONTINENTS } from '../utils/continents';

const ContinentalRadarMap = dynamic(() => import('../components/ContinentalRadarMap'), { ssr: false });

interface City {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  tidePath?: string;
}

interface EffectsSettings {
  crtScanlinesEnabled?: boolean;
  crtFlickerEnabled?: boolean;
  scanlineSweepEnabled?: boolean;
  textGlowEnabled?: boolean;
  panelGlowEnabled?: boolean;
}

interface TextSizeSettings {
  masterSize?: number;
  current?: {
    title?: number;
    temp?: number;
    details?: number;
  };
  localForecastText?: {
    title?: number;
    forecast?: number;
    extended?: number;
  };
  almanac?: {
    title?: number;
    details?: number;
  };
  radar?: {
    title?: number;
    cardinals?: number;
  };
  forecast?: {
    title?: number;
    dayLabel?: number;
    description?: number;
    tempMax?: number;
    tempMin?: number;
    precipitation?: number;
  };
  continentalRadar?: {
    title?: number;
    capital?: number;
    temperature?: number;
    precipitation?: number;
  };
  marineUv?: {
    title?: number;
    details?: number;
  };
  airQuality?: {
    title?: number;
    details?: number;
  };
}

interface RssFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  isScraper?: boolean;
}

interface Settings {
  mainCity: City;
  unitSystem: 'metric' | 'imperial';
  waveProvider?: 'tablademareas' | 'open-meteo';
  cityList: City[];
  slides: {
    current: boolean;
    almanac: boolean;
    forecast: boolean;
    cities?: boolean;
    radar?: boolean;
    localForecastText?: boolean;
    continentalRadar?: boolean;
    marineUv?: boolean;
    airQuality?: boolean;
    broadcastId?: boolean;
  };
  slideOrder?: string[];
  slideDuration: number;
  marqueeText: string;
  marqueeSpeed?: number;
  musicUrls: string[];
  activeMusicUrl: string;
  musicVolume: number;
  musicEnabled: boolean;
  enableAutoAlerts?: boolean;
  customAlert?: string;
  kioskMode?: boolean;
  musicSourceType?: 'archive' | 'local' | 'radio';
  activeRadioUrl?: string;
  activeLocalMusicUrl?: string;
  onlineRadios?: Array<{ name: string; url: string }>;
  localMusicFiles?: string[];
  localSlideshowFiles?: string[];
  voiceoverEnabled?: boolean;
  voiceoverVolume?: number;
  activeRadarType?: 'precipitation' | 'wind' | 'temperature';
  showMusicInTicker?: boolean;
  musicTickerType?: 'name_only' | 'dynamic';
  radarColorScheme?: 'standard' | 'dark' | 'light' | 'satellite' | 'retro_green';
  themeMode?: 'auto' | 'day' | 'night';
  themeTransitionDuration?: number;
  enableWeatherBackgrounds?: boolean;
  customBackgrounds?: Record<string, string>;
  
  // Multimedia panel settings
  sidebarMediaMode?: 'none' | 'tv' | 'images';
  tvStreamType?: 'hls' | 'iframe' | 'blob';
  tvStreamUrl?: string;
  tvStreamVolume?: number;
  slideshowImages?: string[];
  slideshowDuration?: number;
  slideshowTransition?: 'fade' | 'slide' | 'zoom';
  slideshowFit?: 'cover' | 'contain';
  cityScrollSpeed?: number;
  disableWeatherForFun?: boolean;
  continentalSelected?: 'south_america' | 'north_america' | 'europe' | 'asia' | 'africa' | 'oceania';
  clockFormat?: '12h' | '24h';
  clockShowDate?: boolean;
  continentalSpeed?: number;
  continentalLoop?: boolean;
  continentalZoom?: number;
  newsSourceType?: 'manual' | 'rss' | 'mixed';
  subMarqueeSpeed?: number;
  socialNetworks?: Array<{ name: string; handle: string }>;
  localNewsList?: Array<{ text: string; city: string; country: string }>;
  stationIdEnabled?: boolean;
  stationIdName?: string;
  stationIdProvider?: string;
  stationIdVoiceoverText?: string;
  stationIdMinDuration?: number;
  stationIdGraphic?: 'satellite' | 'radar' | 'globe' | 'custom';
  stationIdCustomGraphicUrl?: string;
  broadcastIdLocationOverride?: string;
  broadcastIdWeatherId?: string;
  broadcastIdChannel?: string;
  broadcastIdLogoUrl?: string;
  broadcastIdExtraText?: string;
  broadcastIdTimezone?: string;
  broadcastIdCustomText?: string;
  broadcastIdCopyrightText?: string;
  textSizeSettings?: TextSizeSettings;
  effectsSettings?: EffectsSettings;
  includeCountryNews?: boolean;
  rssFeeds?: RssFeed[];
  providers?: {
    generalWeather?: ProviderConfig;
    temperature?: ProviderConfig;
    precipitation?: ProviderConfig;
    tideWaves?: ProviderConfig;
    airQuality?: ProviderConfig;
    radarRegional?: ProviderConfig;
    radarContinental?: ProviderConfig;
    news?: ProviderConfig;
    radioMusic?: ProviderConfig;
    tvStream?: ProviderConfig;
  };
  geminiAuth?: GeminiAuthConfig;
  security?: SecurityConfig;
}

interface ProviderConfig {
  type: 'default' | 'custom-api' | 'gemini-scraper' | 'custom-tiles' | 'rss' | 'manual';
  url?: string;
  cssSelector?: string;
  prompt?: string;
  apiKey?: string;
  extraHeaders?: Record<string, string>;
}

interface GeminiAuthConfig {
  method: 'api-key' | 'oauth';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: number;
}

interface SecurityConfig {
  enabled: boolean;
  passwordHash: string;
  salt: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}



export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Geocoding states
  const [mainCityQuery, setMainCityQuery] = useState('');
  const [mainCityResults, setMainCityResults] = useState<any[]>([]);
  const [searchingMain, setSearchingMain] = useState(false);

  const [otherCityQuery, setOtherCityQuery] = useState('');
  const [otherCityResults, setOtherCityResults] = useState<any[]>([]);
  const [searchingOther, setSearchingOther] = useState(false);

  // New music URL input
  const [newMusicUrl, setNewMusicUrl] = useState('');
  const [newRadioName, setNewRadioName] = useState('');
  const [newRadioUrl, setNewRadioUrl] = useState('');
  const [newSlideshowUrl, setNewSlideshowUrl] = useState('');

  // Social networks inputs
  const [newSnName, setNewSnName] = useState('');
  const [newSnHandle, setNewSnHandle] = useState('');

  // Local news inputs
  const [newNewsText, setNewNewsText] = useState('');
  const [newNewsCity, setNewNewsCity] = useState('');
  const [newNewsCountry, setNewNewsCountry] = useState('');

  // RSS Custom Feed inputs
  const [newRssName, setNewRssName] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');

  // RSS Refresh states
  const [rssRefreshLoading, setRssRefreshLoading] = useState(false);
  const [rssRefreshResults, setRssRefreshResults] = useState<any[]>([]);

  // Alerts preview state
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Radio metadata test preview state
  const [previewMetadata, setPreviewMetadata] = useState<string>('');
  const [testingMetadata, setTestingMetadata] = useState<boolean>(false);
  const [showCustomBgs, setShowCustomBgs] = useState<boolean>(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Config mode simple / advanced
  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>('simple');
  const [activeCategory, setActiveCategory] = useState<string>('location');
  const [activeProviderAccordion, setActiveProviderAccordion] = useState<string>('gemini-auth');

  // Auth states
  const [authStatus, setAuthStatus] = useState<{
    initialized: boolean;
    authenticated: boolean;
    twoFactorEnabled: boolean;
    loading: boolean;
  }>({
    initialized: false,
    authenticated: true, // Default to true until we check
    twoFactorEnabled: false,
    loading: true
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [setup2faEnabled, setSetup2faEnabled] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Security Management panel states
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityPanel2faEnabled, setSecurityPanel2faEnabled] = useState(false);
  const [securityPanelSecret, setSecurityPanelSecret] = useState('');
  const [securityPanelQrUrl, setSecurityPanelQrUrl] = useState('');
  const [securityPanelCodeInput, setSecurityPanelCodeInput] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityLoading2fa, setSecurityLoading2fa] = useState(false);

  // Gemini Scrapers Testing States
  const [testingScraper, setTestingScraper] = useState<string | null>(null);
  const [scraperTestResult, setScraperTestResult] = useState<any>(null);
  const [scraperTestError, setScraperTestError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('wea-ther-admin-config-mode');
      if (savedMode === 'simple' || savedMode === 'advanced') {
        setConfigMode(savedMode);
      }
    }
  }, []);

  const handleConfigModeChange = (mode: 'simple' | 'advanced') => {
    setConfigMode(mode);
    setActiveCategory('location');
    if (typeof window !== 'undefined') {
      localStorage.setItem('wea-ther-admin-config-mode', mode);
    }
  };

  const handleToggleSetup2fa = async (enabled: boolean) => {
    setSetup2faEnabled(enabled);
    if (enabled && !setupSecret) {
      setSetupLoading(true);
      try {
        const res = await fetch('/api/auth/setup');
        if (res.ok) {
          const data = await res.json();
          setSetupSecret(data.secret);
          setSetupQrUrl(data.qrUrl);
        } else {
          showNotification('error', 'No se pudo generar el secreto 2FA');
        }
      } catch (err) {
        showNotification('error', 'Error de red al inicializar 2FA');
      } finally {
        setSetupLoading(false);
      }
    }
  };

  const handleToggleSecurityPanel2fa = async (enabled: boolean) => {
    setSecurityPanel2faEnabled(enabled);
    if (enabled && !securityPanelSecret) {
      setSecurityLoading2fa(true);
      try {
        const res = await fetch('/api/auth/setup');
        if (res.ok) {
          const data = await res.json();
          setSecurityPanelSecret(data.secret);
          setSecurityPanelQrUrl(data.qrUrl);
        } else {
          showNotification('error', 'No se pudo generar el secreto 2FA');
        }
      } catch (err) {
        showNotification('error', 'Error de red al inicializar 2FA');
      } finally {
        setSecurityLoading2fa(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput, code: codeInput })
      });
      if (res.ok) {
        setPasswordInput('');
        setCodeInput('');
        setAuthStatus(prev => ({ ...prev, authenticated: true }));
        await loadSettings();
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setAuthError('Error de red al iniciar sesión');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordInput,
          twoFactorEnabled: setup2faEnabled,
          twoFactorSecret: setupSecret,
          code: codeInput
        })
      });
      if (res.ok) {
        setPasswordInput('');
        setCodeInput('');
        setAuthStatus({
          initialized: true,
          authenticated: true,
          twoFactorEnabled: setup2faEnabled,
          loading: false
        });
        await loadSettings();
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Error al configurar seguridad');
      }
    } catch (err) {
      setAuthError('Error de red al configurar seguridad');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setAuthStatus(prev => ({ ...prev, authenticated: false }));
        setSettings(null);
      } else {
        showNotification('error', 'Error al cerrar sesión');
      }
    } catch (err) {
      showNotification('error', 'Error de red al cerrar sesión');
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPasswordInput && newPasswordInput !== confirmNewPassword) {
      setSecurityError('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPasswordConfirm,
          password: newPasswordInput || undefined,
          twoFactorEnabled: securityPanel2faEnabled,
          twoFactorSecret: securityPanel2faEnabled ? securityPanelSecret : undefined,
          code: securityPanel2faEnabled !== authStatus.twoFactorEnabled ? securityPanelCodeInput : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSecuritySuccess('Configuración de seguridad actualizada exitosamente');
        setAuthStatus(prev => ({
          ...prev,
          twoFactorEnabled: securityPanel2faEnabled
        }));
        setCurrentPasswordConfirm('');
        setNewPasswordInput('');
        setConfirmNewPassword('');
        setSecurityPanelCodeInput('');
      } else {
        setSecurityError(data.error || 'Error al actualizar seguridad');
      }
    } catch (err) {
      setSecurityError('Error de red al actualizar seguridad');
    }
  };

  const getProviderConfig = (key: string): ProviderConfig => {
    const providersObj = settings?.providers || {};
    return (providersObj[key as keyof typeof providersObj] || { type: 'default', url: '', cssSelector: '', prompt: '' }) as ProviderConfig;
  };

  const updateProviderConfig = (key: string, field: keyof ProviderConfig, value: any) => {
    if (!settings) return;
    const currentProviders = settings.providers || {};
    const currentConfig = (currentProviders[key as keyof typeof currentProviders] || { type: 'default', url: '', cssSelector: '', prompt: '' }) as ProviderConfig;
    
    setSettings({
      ...settings,
      providers: {
        ...currentProviders,
        [key]: {
          ...currentConfig,
          [field]: value
        }
      }
    });
  };

  const testScraper = async (providerKey: string, url: string, cssSelector: string, prompt: string) => {
    if (!url || !prompt) {
      showNotification('error', 'Se requiere una URL y un Prompt para probar el scraper');
      return;
    }
    setTestingScraper(providerKey);
    setScraperTestResult(null);
    setScraperTestError(null);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cssSelector, prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setScraperTestResult(data.result);
      } else {
        setScraperTestError(data.error || 'Error al probar el scraper');
      }
    } catch (e: any) {
      setScraperTestError(e.message || 'Error de red al probar el scraper');
    } finally {
      setTestingScraper(null);
    }
  };

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        showNotification('error', 'Error al cargar configuraciones');
      }
    } catch (err) {
      showNotification('error', 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  // Fetch settings or check authentication on mount
  useEffect(() => {
    async function checkAuthentication() {
      try {
        const res = await fetch('/api/auth/login');
        if (res.ok) {
          const data = await res.json();
          setAuthStatus({
            initialized: data.initialized,
            authenticated: data.authenticated,
            twoFactorEnabled: data.twoFactorEnabled,
            loading: false
          });
          setSecurityPanel2faEnabled(data.twoFactorEnabled);
          if (data.authenticated || !data.initialized) {
            await loadSettings();
          }
        } else {
          setAuthStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        console.error('Failed checking auth:', e);
        setAuthStatus(prev => ({ ...prev, loading: false }));
      }
    }
    checkAuthentication();

    // Check Google Auth redirects
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authResult = urlParams.get('auth');
      if (authResult === 'success') {
        showNotification('success', '¡Conexión con Google OAuth exitosa!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authResult === 'error') {
        const msg = urlParams.get('message') || 'Fallo desconocido';
        showNotification('error', `Error en Google Auth: ${msg}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Fetch active alerts for main city to show a live preview
  useEffect(() => {
    async function fetchActiveAlerts() {
      if (!settings?.mainCity) return;
      try {
        const res = await fetch('/api/weather', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setActiveAlerts(data.alerts || []);
        }
      } catch (e) {
        console.error("Failed to fetch alerts preview", e);
      }
    }
    fetchActiveAlerts();
  }, [settings?.mainCity]);

  const renderLoginView = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        fontFamily: 'sans-serif',
        padding: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '450px',
          color: '#fff',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0.25rem 0', color: '#60a5fa', textShadow: '0 0 10px rgba(96, 165, 250, 0.3)' }}>Acceso Protegido</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Introduce tus credenciales para administrar WEA-ther</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 'bold' }}>Contraseña Maestra</label>
              <input
                type="password"
                className="form-input"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {authStatus.twoFactorEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 'bold' }}>Código 2FA (TOTP)</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={6}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '0.75rem 1rem',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.4em',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="000000"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  required
                />
              </div>
            )}

            {authError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: '#f87171',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.8rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                cursor: 'pointer',
                transition: 'transform 0.1s, opacity 0.2s'
              }}
            >
              Iniciar Sesión 🔒
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderSetupView = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        fontFamily: 'sans-serif',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '500px',
          color: '#fff'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.5rem 0 0.25rem 0', color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}>Configuración de Seguridad</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Inicializa la contraseña maestra del Administrador para proteger el sistema.</p>
          </div>

          <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 'bold' }}>Nueva Contraseña Maestra</label>
              <input
                type="password"
                className="form-input"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Mínimo 4 caracteres..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={setup2faEnabled}
                  onChange={(e) => handleToggleSetup2fa(e.target.checked)}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                Activar Autenticación de Dos Factores (2FA / TOTP)
              </label>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
                Recomendado para evitar modificaciones no autorizadas a tus configuraciones.
              </p>

              {setup2faEnabled && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                  {setupLoading ? (
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#60a5fa' }}>Generando código de vinculación...</p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '0.5rem', borderRadius: '8px', width: 'fit-content', margin: '0 auto' }}>
                        {setupQrUrl ? (
                          <img src={setupQrUrl} alt="Código QR de Configuración 2FA" style={{ width: '150px', height: '150px' }} />
                        ) : (
                          <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.8rem' }}>Cargando QR...</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Escanea el código QR con tu app TOTP preferida.</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>O introduce la clave secreta manualmente:</p>
                        <code style={{ fontSize: '0.95rem', color: '#ecc94b', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem', letterSpacing: '1px' }}>{setupSecret}</code>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 'bold' }}>Ingresa el código de verificación de 6 dígitos</label>
                        <input
                          type="text"
                          className="form-input"
                          maxLength={6}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '0.6rem 1rem',
                            fontSize: '1.2rem',
                            textAlign: 'center',
                            letterSpacing: '0.4em',
                            outline: 'none'
                          }}
                          placeholder="000000"
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: '#f87171',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-success"
              style={{
                padding: '0.8rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                cursor: 'pointer'
              }}
            >
              Inicializar y Guardar Seguridad 🔐
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderSecurityCard = () => {
    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#ecc94b' }}>
          🔒 Seguridad y Control de Acceso
        </h2>

        {securityError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.75rem', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️ {securityError}
          </div>
        )}
        {securitySuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '0.75rem', color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            ✓ {securitySuccess}
          </div>
        )}

        <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Change password fields */}
          <div style={{ background: '#202632', padding: '1.2rem', borderRadius: '8px', border: '1px solid #2d3748' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Cambiar Contraseña Maestra</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  placeholder="Mínimo 4 caracteres..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  placeholder="Confirmar contraseña..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', margin: 0 }}>
              Deja estos campos vacíos si solo deseas modificar la configuración de dos factores (2FA).
            </p>
          </div>

          {/* Two-Factor Authentication (2FA) Panel */}
          <div style={{ background: '#202632', padding: '1.2rem', borderRadius: '8px', border: '1px solid #2d3748' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>Verificación en Dos Pasos (2FA)</h3>
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '1rem' }}>
              Protege el Panel de Control agregando una capa adicional de seguridad con un token temporal dinámico (TOTP).
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={securityPanel2faEnabled}
                  onChange={(e) => handleToggleSecurityPanel2fa(e.target.checked)}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                Habilitar Autenticación de Dos Factores
              </label>
            </div>

            {/* Toggle 2FA flow details */}
            {securityPanel2faEnabled && !authStatus.twoFactorEnabled && (
              <div style={{ background: '#1a202c', padding: '1rem', borderRadius: '6px', border: '1px solid #4a5568', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ecc94b', margin: 0 }}>Vincular dispositivo 2FA</h4>
                
                {securityLoading2fa ? (
                  <p style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Generando llave secreta...</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '0.5rem', borderRadius: '6px', width: 'fit-content', margin: '0 auto' }}>
                      {securityPanelQrUrl ? (
                        <img src={securityPanelQrUrl} alt="Código QR de Configuración 2FA" style={{ width: '150px', height: '150px' }} />
                      ) : (
                        <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.8rem' }}>Cargando QR...</div>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#cbd5e0' }}>
                      <p>Escanea el QR en tu app de autenticación o usa esta clave secreta:</p>
                      <code style={{ fontSize: '0.9rem', color: '#ecc94b', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem' }}>
                        {securityPanelSecret}
                      </code>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Código de verificación del dispositivo</label>
                      <input
                        type="text"
                        className="form-input"
                        maxLength={6}
                        style={{ background: '#2d3748', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
                        placeholder="000000"
                        value={securityPanelCodeInput}
                        onChange={(e) => setSecurityPanelCodeInput(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* If 2FA was enabled and user unchecked it, prompt for confirmation code */}
            {!securityPanel2faEnabled && authStatus.twoFactorEnabled && (
              <div style={{ background: '#1a202c', padding: '1rem', borderRadius: '6px', border: '1px solid #e53e3e', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#f56565', margin: 0 }}>Deshabilitar Autenticación de Dos Factores</h4>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e0', margin: 0 }}>
                  Por motivos de seguridad, debes ingresar tu código 2FA actual para confirmar que deseas desactivarlo.
                </p>

                <div className="form-group">
                  <label className="form-label">Código 2FA Actual</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={6}
                    style={{ background: '#2d3748', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
                    placeholder="000000"
                    value={securityPanelCodeInput}
                    onChange={(e) => setSecurityPanelCodeInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {securityPanel2faEnabled && authStatus.twoFactorEnabled && (
              <p style={{ fontSize: '0.85rem', color: '#48bb78', marginTop: '0.5rem', fontWeight: 'bold' }}>
                ✓ Verificación de Dos Factores (2FA) configurada y activa.
              </p>
            )}
          </div>

          {/* Confirm changes with master password */}
          <div style={{ background: '#1a202c', padding: '1.2rem', borderRadius: '8px', border: '1px solid #4a5568' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>Confirmar Cambios</h3>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e0', marginBottom: '1rem' }}>
              Para aplicar las modificaciones de contraseña o 2FA, por favor introduce tu contraseña maestra actual.
            </p>
            
            <div className="form-group">
              <label className="form-label">Contraseña Maestra Actual</label>
              <input
                type="password"
                className="form-input"
                style={{ background: '#2d3748' }}
                placeholder="••••••••"
                value={currentPasswordConfirm}
                onChange={(e) => setCurrentPasswordConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            style={{ fontSize: '1rem', padding: '0.7rem 1.5rem', alignSelf: 'flex-end' }}
          >
            Aplicar Cambios de Seguridad 🔐
          </button>
        </form>
      </section>
    );
  };

  const renderProvidersCard = () => {
    if (!settings) return null;
    const geminiAuth = settings.geminiAuth || { method: 'api-key', apiKey: '', clientId: '', clientSecret: '', refreshToken: '' };
    
    const handleGoogleLink = async () => {
      setSaving(true);
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        if (res.ok) {
          window.location.href = '/api/auth/google';
        } else {
          showNotification('error', 'Error al guardar credenciales OAuth temporales');
        }
      } catch (err) {
        showNotification('error', 'Error de red al inicializar Google Link');
      } finally {
        setSaving(false);
      }
    };

    const handleGoogleUnlink = () => {
      setSettings({
        ...settings,
        geminiAuth: {
          ...geminiAuth,
          refreshToken: undefined,
          accessToken: undefined,
          tokenExpiry: undefined
        }
      });
      showNotification('success', 'Cuenta de Google desvinculada. Asegúrate de guardar los cambios.');
    };

    const renderAccordionHeader = (id: string, icon: string, title: string) => {
      const isOpen = activeProviderAccordion === id;
      return (
        <div
          onClick={() => setActiveProviderAccordion(isOpen ? '' : id)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isOpen ? '#2d3748' : '#202632',
            padding: '0.8rem 1.2rem',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '1px solid #2d3748',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}
          onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = '#28303f'; }}
          onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = '#202632'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>{icon}</span>
            <span>{title}</span>
          </span>
          <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>{isOpen ? '▼' : '▶'}</span>
        </div>
      );
    };

    const renderScraperConfigFields = (providerKey: string) => {
      const config = getProviderConfig(providerKey);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#1a202c', borderRadius: '6px', border: '1px solid #2d3748' }}>
          <div className="form-group">
            <label className="form-label font-bold">URL del Sitio Web Objetivo</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748' }}
              placeholder="https://ejemplo.com/pagina-de-clima-noticias"
              value={config.url || ''}
              onChange={(e) => updateProviderConfig(providerKey, 'url', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Selector CSS Principal (Opcional - Id o Clase para aislar contenido HTML)</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748' }}
              placeholder="Ej: #main-content o .weather-card"
              value={config.cssSelector || ''}
              onChange={(e) => updateProviderConfig(providerKey, 'cssSelector', e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>
              Reduce los tokens consumidos y mejora la precisión filtrando solo la parte de interés de la página web.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Prompt del Modelo Gemini (Opcional)</label>
            <textarea
              className="form-input"
              style={{ background: '#2d3748', height: '80px', fontSize: '0.85rem' }}
              placeholder="Prompt por defecto o instrucciones especiales..."
              value={config.prompt || ''}
              onChange={(e) => updateProviderConfig(providerKey, 'prompt', e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => testScraper(providerKey, config.url || '', config.cssSelector || '', config.prompt || 'Extrae información estructurada de este HTML.')}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
            disabled={testingScraper === providerKey}
          >
            {testingScraper === providerKey ? 'Probando Scraper...' : 'Probar Scraper de Gemini 🧪'}
          </button>

          {testingScraper === providerKey && (
            <p style={{ fontSize: '0.85rem', color: '#60a5fa', margin: 0, marginTop: '0.5rem' }}>Enviando contenido de raspado web a Gemini AI Studio...</p>
          )}

          {scraperTestError && testingScraper === null && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '0.75rem', color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <strong>Error:</strong> {scraperTestError}
            </div>
          )}

          {scraperTestResult && testingScraper === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#48bb78', fontWeight: 'bold' }}>Resultado Exitoso del Scraper (JSON):</span>
              <pre style={{ background: '#0d1117', padding: '0.75rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.8rem', color: '#9fef00', maxHeight: '200px', margin: 0 }}>
                {JSON.stringify(scraperTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    };

    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#48bb78' }}>
          🔌 Proveedores de Datos y Conexiones APIs
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Configura de dónde obtiene la información tu sistema de transmisión del clima. Puedes usar los proveedores nativos por defecto o habilitar el raspado web inteligente mediante <strong>Gemini AI Studio</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          
          {/* 1. CREDENCIALES GEMINI AI */}
          {renderAccordionHeader('gemini-auth', '🔑', 'Conexión con Gemini AI Studio')}
          {activeProviderAccordion === 'gemini-auth' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Método de Autenticación de Gemini</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={geminiAuth.method}
                  onChange={(e) => setSettings({
                    ...settings,
                    geminiAuth: { ...geminiAuth, method: e.target.value as any }
                  })}
                >
                  <option value="api-key">API Key Directa (Fácil y Recomendado)</option>
                  <option value="oauth">Vincular Cuenta Google (OAuth 2.0 Client Credentials)</option>
                </select>
              </div>

              {geminiAuth.method === 'api-key' ? (
                <div className="form-group">
                  <label className="form-label">Gemini API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    style={{ background: '#2d3748' }}
                    placeholder="Introduce tu clave API de Gemini AI..."
                    value={geminiAuth.apiKey || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      geminiAuth: { ...geminiAuth, apiKey: e.target.value.trim() }
                    })}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>
                    Obtén una clave API gratuita en <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>Google AI Studio</a>.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label font-bold">Google Client ID</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: '#2d3748' }}
                        placeholder="..."
                        value={geminiAuth.clientId || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          geminiAuth: { ...geminiAuth, clientId: e.target.value.trim() }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label font-bold">Google Client Secret</label>
                      <input
                        type="password"
                        className="form-input"
                        style={{ background: '#2d3748' }}
                        placeholder="..."
                        value={geminiAuth.clientSecret || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          geminiAuth: { ...geminiAuth, clientSecret: e.target.value.trim() }
                        })}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#1a202c', padding: '1rem', borderRadius: '6px', border: '1px solid #4a5568', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Vincular Cuenta de Google</span>
                      <span style={{ fontSize: '0.75rem', color: geminiAuth.refreshToken ? '#48bb78' : '#a0aec0' }}>
                        {geminiAuth.refreshToken ? '✓ Estado: Cuenta Vinculada' : 'Estado: Cuenta sin vincular'}
                      </span>
                    </div>
                    {geminiAuth.refreshToken ? (
                      <button type="button" onClick={handleGoogleUnlink} className="btn btn-danger">
                        Desvincular
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoogleLink}
                        className="btn btn-primary"
                        disabled={!geminiAuth.clientId || !geminiAuth.clientSecret}
                      >
                        Vincular Cuenta 🔑
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. PROVEEDOR CLIMA */}
          {renderAccordionHeader('weather', '🌤️', 'Clima y Pronóstico Principal')}
          {activeProviderAccordion === 'weather' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Motor de Clima Principal</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('generalWeather').type}
                  onChange={(e) => updateProviderConfig('generalWeather', 'type', e.target.value as any)}
                >
                  <option value="default">Open-Meteo API (Por Defecto)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI</option>
                </select>
              </div>
              {getProviderConfig('generalWeather').type === 'gemini-scraper' && renderScraperConfigFields('generalWeather')}
            </div>
          )}

          {/* 3. PROVEEDOR MAREAS */}
          {renderAccordionHeader('tides', '🌊', 'Marea y Oleaje')}
          {activeProviderAccordion === 'tides' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Proveedor de Oleaje y Marea</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('tideWaves').type === 'default' ? (settings.waveProvider || 'tablademareas') : getProviderConfig('tideWaves').type}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'tablademareas' || val === 'open-meteo') {
                      setSettings({ ...settings, waveProvider: val as any });
                      updateProviderConfig('tideWaves', 'type', 'default');
                    } else {
                      updateProviderConfig('tideWaves', 'type', val as any);
                    }
                  }}
                >
                  <option value="tablademareas">Tabla de Mareas (Scraper Nativo tablademareas.com)</option>
                  <option value="open-meteo">Open-Meteo Marine API (Pronóstico del oleaje)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI</option>
                </select>
              </div>
              {getProviderConfig('tideWaves').type === 'gemini-scraper' && renderScraperConfigFields('tideWaves')}
            </div>
          )}

          {/* 4. PROVEEDOR CALIDAD DE AIRE */}
          {renderAccordionHeader('air-quality', '🍃', 'Calidad del Aire')}
          {activeProviderAccordion === 'air-quality' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Proveedor de Calidad del Aire</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('airQuality').type}
                  onChange={(e) => updateProviderConfig('airQuality', 'type', e.target.value as any)}
                >
                  <option value="default">Open-Meteo Air Quality (Por Defecto)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI</option>
                </select>
              </div>
              {getProviderConfig('airQuality').type === 'gemini-scraper' && renderScraperConfigFields('airQuality')}
            </div>
          )}

          {/* 5. PROVEEDOR RADARES Y MAPAS */}
          {renderAccordionHeader('radar', '📡', 'Radares de Precipitación y Viento')}
          {activeProviderAccordion === 'radar' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Servidor de Mapas para el Radar</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('radarRegional').type}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateProviderConfig('radarRegional', 'type', val);
                    updateProviderConfig('radarContinental', 'type', val);
                  }}
                >
                  <option value="default">RainViewer (Capa en vivo por defecto)</option>
                  <option value="custom-tiles">Servidor de Mosaicos Personalizado (Tile Server)</option>
                </select>
              </div>

              {getProviderConfig('radarRegional').type === 'custom-tiles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: '#1a202c', borderRadius: '6px' }}>
                  <div className="form-group">
                    <label className="form-label font-bold">URL Template del Servidor de Tiles (Regional)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ background: '#2d3748' }}
                      placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png"
                      value={getProviderConfig('radarRegional').url || ''}
                      onChange={(e) => updateProviderConfig('radarRegional', 'url', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label font-bold">URL Template del Servidor de Tiles (Continental)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ background: '#2d3748' }}
                      placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png"
                      value={getProviderConfig('radarContinental').url || ''}
                      onChange={(e) => updateProviderConfig('radarContinental', 'url', e.target.value)}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#a0aec0', margin: 0 }}>
                    Soporta placeholders <code>{`{x}`}</code>, <code>{`{y}`}</code>, <code>{`{z}`}</code> y subdominios <code>{`{s}`}</code>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 6. PROVEEDOR NOTICIAS */}
          {renderAccordionHeader('news', '📰', 'Noticias y Ticker')}
          {activeProviderAccordion === 'news' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tipo de Proveedor de Noticias</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('news').type === 'default' ? (settings.newsSourceType || 'rss') : getProviderConfig('news').type}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'manual' || val === 'rss' || val === 'mixed') {
                      setSettings({ ...settings, newsSourceType: val as any });
                      updateProviderConfig('news', 'type', 'default');
                    } else {
                      updateProviderConfig('news', 'type', val as any);
                    }
                  }}
                >
                  <option value="rss">Feeds RSS Personalizados (Por Defecto)</option>
                  <option value="mixed">Feeds RSS + Noticias Manuales</option>
                  <option value="manual">Solo Noticias Manuales (Configuradas en Marquesina)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI</option>
                </select>
              </div>

              {getProviderConfig('news').type === 'gemini-scraper' ? (
                renderScraperConfigFields('news')
              ) : (
                <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.8rem' }}>Gestión de Feeds RSS</h4>
                  
                  {/* List of feeds */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(settings.rssFeeds || []).map((feed, idx) => (
                      <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a202c', padding: '0.5rem 0.8rem', borderRadius: '4px', border: '1px solid #2d3748' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            type="checkbox"
                            checked={feed.enabled}
                            onChange={(e) => {
                              const updated = [...(settings.rssFeeds || [])];
                              updated[idx] = { ...updated[idx], enabled: e.target.checked };
                              setSettings({ ...settings, rssFeeds: updated });
                            }}
                          />
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#cbd5e0', fontSize: '0.85rem' }}>{feed.name} </span>
                            <span style={{ fontSize: '0.75rem', color: '#a0aec0', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }} title={feed.url}>
                              {feed.url}
                            </span>
                          </div>
                        </div>
                        {!feed.isBuiltIn && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (settings.rssFeeds || []).filter((_, i) => i !== idx);
                              setSettings({ ...settings, rssFeeds: updated });
                            }}
                            className="btn btn-danger"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                          >
                            Eliminar 🗑️
                          </button>
                        )}
                      </div>
                    ))}
                    {(settings.rssFeeds || []).length === 0 && (
                      <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#a0aec0' }}>No hay feeds RSS agregados.</p>
                    )}
                  </div>

                  {/* Add feed form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end', background: '#1a202c', padding: '0.8rem', borderRadius: '6px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre del Feed</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: '#2d3748', fontSize: '0.85rem' }}
                        value={newRssName}
                        onChange={(e) => setNewRssName(e.target.value)}
                        placeholder="Ej: Emol Nacional"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>URL del Feed</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: '#2d3748', fontSize: '0.85rem' }}
                        value={newRssUrl}
                        onChange={(e) => setNewRssUrl(e.target.value)}
                        placeholder="Ej: https://.../feed.xml"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newRssName.trim() || !newRssUrl.trim()) return;
                        const newFeed: RssFeed = {
                          id: 'rss-' + Date.now(),
                          name: newRssName.trim(),
                          url: newRssUrl.trim(),
                          enabled: true
                        };
                        setSettings({
                          ...settings,
                          rssFeeds: [...(settings.rssFeeds || []), newFeed]
                        });
                        setNewRssName('');
                        setNewRssUrl('');
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.8rem' }}
                    >
                      Añadir ➕
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    Consejo: Puedes usar los placeholders <code>{`{ciudad}`}</code> y <code>{`{pais}`}</code> en la URL para búsquedas adaptativas en vivo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 7. PROVEEDOR RADIO */}
          {renderAccordionHeader('audio', '🎵', 'Radio Online y Música')}
          {activeProviderAccordion === 'audio' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Proveedor de Radio Streaming</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('radioMusic').type}
                  onChange={(e) => updateProviderConfig('radioMusic', 'type', e.target.value as any)}
                >
                  <option value="default">Estaciones de Radio Estáticas (Por Defecto)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI (Obtención de Stream Dinámico)</option>
                </select>
              </div>

              {getProviderConfig('radioMusic').type === 'gemini-scraper' ? (
                renderScraperConfigFields('radioMusic')
              ) : (
                <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.8rem' }}>Gestión de Radios Online</h4>
                  
                  {/* List of radios */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(settings.onlineRadios || []).map((radio, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a202c', padding: '0.5rem 0.8rem', borderRadius: '4px', border: '1px solid #2d3748' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#cbd5e0', fontSize: '0.85rem' }}>{radio.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#a0aec0', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }} title={radio.url}>
                            {radio.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (settings.onlineRadios || []).filter((_, i) => i !== idx);
                            setSettings({ ...settings, onlineRadios: updated });
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                        >
                          Eliminar 🗑️
                        </button>
                      </div>
                    ))}
                    {(!settings.onlineRadios || settings.onlineRadios.length === 0) && (
                      <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#a0aec0' }}>No hay radios online configuradas.</p>
                    )}
                  </div>

                  {/* Add radio form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end', background: '#1a202c', padding: '0.8rem', borderRadius: '6px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre Radio</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: '#2d3748', fontSize: '0.85rem' }}
                        value={newRadioName}
                        onChange={(e) => setNewRadioName(e.target.value)}
                        placeholder="Ej: Radio Biobío"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>URL del Stream</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: '#2d3748', fontSize: '0.85rem' }}
                        value={newRadioUrl}
                        onChange={(e) => setNewRadioUrl(e.target.value)}
                        placeholder="Ej: https://.../stream.mp3"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newRadioName.trim() || !newRadioUrl.trim()) return;
                        const updated = [...(settings.onlineRadios || []), { name: newRadioName.trim(), url: newRadioUrl.trim() }];
                        setSettings({ ...settings, onlineRadios: updated });
                        setNewRadioName('');
                        setNewRadioUrl('');
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 0.8rem' }}
                    >
                      Añadir ➕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. PROVEEDOR TV */}
          {renderAccordionHeader('video', '📺', 'Televisión y Video Stream')}
          {activeProviderAccordion === 'video' && (
            <div style={{ padding: '1rem', background: '#202632', borderRadius: '0 0 6px 6px', border: '1px solid #2d3748', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Proveedor de Transmisión de TV</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748' }}
                  value={getProviderConfig('tvStream').type}
                  onChange={(e) => updateProviderConfig('tvStream', 'type', e.target.value as any)}
                >
                  <option value="default">URL de Stream Estático (HLS / Iframe Directo)</option>
                  <option value="gemini-scraper">Scraper Web + Gemini AI (Obtención de URL Dinámica)</option>
                </select>
              </div>

              {getProviderConfig('tvStream').type === 'gemini-scraper' ? (
                renderScraperConfigFields('tvStream')
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: '#1a202c', borderRadius: '6px' }}>
                  <div className="form-group">
                    <label className="form-label font-bold">Tipo de Transmisión (TV)</label>
                    <select
                      className="form-input"
                      style={{ background: '#2d3748' }}
                      value={settings.tvStreamType || 'hls'}
                      onChange={(e) => setSettings({ ...settings, tvStreamType: e.target.value as any })}
                    >
                      <option value="hls">Directo HLS (.m3u8) - Carga y sonido nativo</option>
                      <option value="iframe">Incrustar Iframe (Ej: YouTube Live, Twitch, etc.)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label font-bold">URL de la Transmisión de TV</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ background: '#2d3748' }}
                      placeholder={settings.tvStreamType === 'iframe' ? 'https://www.youtube.com/embed/...' : 'https://ejemplo.com/live/playlist.m3u8'}
                      value={settings.tvStreamUrl || ''}
                      onChange={(e) => setSettings({ ...settings, tvStreamUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    );
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const CLASSIC_MUSIC_PRESETS = [
    "https://archive.org/download/weatherscancompletecollection/01%20Fair%20Weather.mp3",
    "https://archive.org/download/weatherscancompletecollection/01%20Lazy%20Days.mp3",
    "https://archive.org/download/weatherscancompletecollection/02%20Beach%20Frolic.mp3",
    "https://archive.org/download/weatherscancompletecollection/02%20Good%20Ole%20Days.mp3",
    "https://archive.org/download/weatherscancompletecollection/03%20Jumpin_.mp3",
    "https://archive.org/download/weatherscancompletecollection/05%20Midnight%20Cruise.mp3",
    "https://archive.org/download/weatherscancompletecollection/07%20Smooth%20Sailing.mp3"
  ];

  const restoreClassicMusicPresets = () => {
    if (!settings) return;
    const combined = Array.from(new Set([...settings.musicUrls, ...CLASSIC_MUSIC_PRESETS]));
    setSettings({
      ...settings,
      musicUrls: combined,
      activeMusicUrl: settings.activeMusicUrl || CLASSIC_MUSIC_PRESETS[0]
    });
    showNotification('success', 'Pistas clásicas de Trammell Starks añadidas a la lista');
  };

  const getPreviewAlerts = () => {
    if (!settings) return [];
    const list: any[] = [];
    if (settings.customAlert && settings.customAlert.trim() !== '') {
      list.push({
        type: 'manual',
        title: 'AVISO ESPECIAL (MANUAL)',
        description: settings.customAlert.trim().toUpperCase(),
        severity: 'danger'
      });
    }
    if (settings.enableAutoAlerts !== false) {
      const autoAlerts = activeAlerts.filter(a => a.type === 'automatic');
      list.push(...autoAlerts);
    }
    return list;
  };

  // Search main city
  const searchMainCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainCityQuery.trim()) return;
    setSearchingMain(true);
    try {
      const res = await fetch(`/api/geocoding?q=${encodeURIComponent(mainCityQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setMainCityResults(data.results || []);
        if (!data.results || data.results.length === 0) {
          showNotification('error', 'No se encontraron resultados');
        }
      }
    } catch (err) {
      showNotification('error', 'Error al buscar ciudades');
    } finally {
      setSearchingMain(false);
    }
  };

  // Search secondary city
  const searchOtherCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherCityQuery.trim()) return;
    setSearchingOther(true);
    try {
      const res = await fetch(`/api/geocoding?q=${encodeURIComponent(otherCityQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setOtherCityResults(data.results || []);
        if (!data.results || data.results.length === 0) {
          showNotification('error', 'No se encontraron resultados');
        }
      }
    } catch (err) {
      showNotification('error', 'Error al buscar ciudades');
    } finally {
      setSearchingOther(false);
    }
  };

  const selectMainCity = (result: any) => {
    if (!settings) return;
    const newMain: City = {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country || (result.admin1 ? `${result.admin1}, ` : '') + (result.country_code || '')
    };
    setSettings({ ...settings, mainCity: newMain });
    setMainCityResults([]);
    setMainCityQuery('');
    showNotification('success', `Ciudad principal actualizada a: ${newMain.name}`);
  };

  const selectOtherCity = (result: any) => {
    if (!settings) return;
    const cityToAdd: City = {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country || (result.admin1 ? `${result.admin1}, ` : '') + (result.country_code || '')
    };

    // Check duplicates
    if (settings.cityList.some(c => c.latitude === cityToAdd.latitude && c.longitude === cityToAdd.longitude)) {
      showNotification('error', 'La ciudad ya está en la lista');
      return;
    }

    setSettings({
      ...settings,
      cityList: [...settings.cityList, cityToAdd]
    });
    setOtherCityResults([]);
    setOtherCityQuery('');
    showNotification('success', `Añadida: ${cityToAdd.name}`);
  };

  const deleteOtherCity = (index: number) => {
    if (!settings) return;
    const newList = [...settings.cityList];
    newList.splice(index, 1);
    setSettings({ ...settings, cityList: newList });
  };

  const moveOtherCity = (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const list = [...settings.cityList];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setSettings({ ...settings, cityList: list });
  };

  const addMusicUrl = () => {
    if (!settings || !newMusicUrl.trim()) return;
    if (settings.musicUrls.includes(newMusicUrl.trim())) {
      showNotification('error', 'El URL de audio ya existe');
      return;
    }
    const updated = [...settings.musicUrls, newMusicUrl.trim()];
    setSettings({
      ...settings,
      musicUrls: updated,
      activeMusicUrl: settings.activeMusicUrl || newMusicUrl.trim()
    });
    setNewMusicUrl('');
    showNotification('success', 'URL agregada correctamente');
  };

  const removeMusicUrl = (url: string) => {
    if (!settings) return;
    const updated = settings.musicUrls.filter(u => u !== url);
    let active = settings.activeMusicUrl;
    if (active === url) {
      active = updated.length > 0 ? updated[0] : '';
    }
    setSettings({
      ...settings,
      musicUrls: updated,
      activeMusicUrl: active
    });
  };

  const addOnlineRadio = () => {
    if (!settings || !newRadioName.trim() || !newRadioUrl.trim()) {
      showNotification('error', 'Nombre y URL de la radio son requeridos');
      return;
    }
    const currentRadios = settings.onlineRadios || [];
    if (currentRadios.some(r => r.url === newRadioUrl.trim())) {
      showNotification('error', 'Esta URL de radio ya existe');
      return;
    }
    const updated = [...currentRadios, { name: newRadioName.trim(), url: newRadioUrl.trim() }];
    setSettings({
      ...settings,
      onlineRadios: updated,
      activeRadioUrl: settings.activeRadioUrl || newRadioUrl.trim()
    });
    setNewRadioName('');
    setNewRadioUrl('');
    showNotification('success', 'Radio agregada correctamente');
  };

  const removeOnlineRadio = (url: string) => {
    if (!settings) return;
    const currentRadios = settings.onlineRadios || [];
    const updated = currentRadios.filter(r => r.url !== url);
    let active = settings.activeRadioUrl;
    if (active === url) {
      active = updated.length > 0 ? updated[0].url : '';
    }
    setSettings({
      ...settings,
      onlineRadios: updated,
      activeRadioUrl: active
    });
    showNotification('success', 'Radio eliminada');
  };

  const addSocialNetwork = () => {
    if (!settings) return;
    if (!newSnName.trim() || !newSnHandle.trim()) {
      showNotification('error', 'Por favor ingresa el nombre de la red y el usuario/handle.');
      return;
    }
    const list = settings.socialNetworks || [];
    const updated = [...list, { name: newSnName.trim(), handle: newSnHandle.trim() }];
    setSettings({ ...settings, socialNetworks: updated });
    setNewSnName('');
    setNewSnHandle('');
    showNotification('success', 'Red social agregada temporalmente. Recuerda guardar cambios.');
  };

  const deleteSocialNetwork = (index: number) => {
    if (!settings || !settings.socialNetworks) return;
    const updated = settings.socialNetworks.filter((_, idx) => idx !== index);
    setSettings({ ...settings, socialNetworks: updated });
    showNotification('success', 'Red social eliminada temporalmente. Recuerda guardar cambios.');
  };

  const addLocalNews = () => {
    if (!settings) return;
    if (!newNewsText.trim()) {
      showNotification('error', 'El texto de la noticia no puede estar vacío.');
      return;
    }
    const list = settings.localNewsList || [];
    const updated = [
      ...list,
      {
        text: newNewsText.trim(),
        city: newNewsCity.trim(),
        country: newNewsCountry.trim()
      }
    ];
    setSettings({ ...settings, localNewsList: updated });
    setNewNewsText('');
    setNewNewsCity('');
    setNewNewsCountry('');
    showNotification('success', 'Noticia agregada temporalmente. Recuerda guardar cambios.');
  };

  const deleteLocalNews = (index: number) => {
    if (!settings || !settings.localNewsList) return;
    const updated = settings.localNewsList.filter((_, idx) => idx !== index);
    setSettings({ ...settings, localNewsList: updated });
    showNotification('success', 'Noticia eliminada temporalmente. Recuerda guardar cambios.');
  };

  const addRssFeed = () => {
    if (!settings) return;
    if (!newRssName.trim() || !newRssUrl.trim()) {
      showNotification('error', 'El nombre y la URL de la fuente RSS no pueden estar vacíos.');
      return;
    }
    if (!newRssUrl.startsWith('http://') && !newRssUrl.startsWith('https://')) {
      showNotification('error', 'La URL del feed debe comenzar con http:// o https://');
      return;
    }
    const feeds = settings.rssFeeds || [];
    const id = 'custom-' + Date.now().toString();
    const updated = [
      ...feeds,
      {
        id,
        name: newRssName.trim(),
        url: newRssUrl.trim(),
        enabled: true
      }
    ];
    setSettings({ ...settings, rssFeeds: updated });
    setNewRssName('');
    setNewRssUrl('');
    showNotification('success', 'Fuente RSS agregada temporalmente. Recuerda guardar cambios.');
  };

  const deleteRssFeed = (id: string) => {
    if (!settings || !settings.rssFeeds) return;
    const feed = settings.rssFeeds.find(f => f.id === id);
    if (feed?.isBuiltIn) {
      showNotification('error', 'No puedes eliminar fuentes integradas del sistema.');
      return;
    }
    const updated = settings.rssFeeds.filter(f => f.id !== id);
    setSettings({ ...settings, rssFeeds: updated });
    showNotification('success', 'Fuente RSS eliminada temporalmente. Recuerda guardar cambios.');
  };

  const toggleRssFeed = (id: string) => {
    if (!settings || !settings.rssFeeds) return;
    const updated = settings.rssFeeds.map(f => {
      if (f.id === id) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    setSettings({ ...settings, rssFeeds: updated });
  };


  const handleRssRefresh = async () => {
    if (!settings?.mainCity) return;
    setRssRefreshLoading(true);
    try {
      const res = await fetch(`/api/local-news?city=${encodeURIComponent(settings.mainCity.name)}&country=${encodeURIComponent(settings.mainCity.country)}&refresh=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.news) {
          setRssRefreshResults(data.news);
          showNotification('success', 'Feed de noticias RSS actualizado y verificado con éxito');
        } else {
          showNotification('error', 'No se encontraron noticias para esta ubicación.');
        }
      } else {
        showNotification('error', 'Error al consultar el servidor de noticias.');
      }
    } catch (e) {
      showNotification('error', 'Error de conexión al actualizar el feed.');
    } finally {
      setRssRefreshLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showNotification('success', 'Configuración guardada exitosamente');
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('wea-ther-settings');
          channel.postMessage({ type: 'settings-updated' });
          channel.close();
        }
      } else {
        const data = await res.json();
        showNotification('error', `Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (err) {
      showNotification('error', 'Error de red al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const testRadioMetadata = async () => {
    if (!settings || !settings.activeRadioUrl) {
      showNotification('error', 'No hay una radio activa seleccionada para probar');
      return;
    }
    setTestingMetadata(true);
    setPreviewMetadata('Conectando con la radio...');
    try {
      const res = await fetch(`/api/radio-metadata?url=${encodeURIComponent(settings.activeRadioUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setPreviewMetadata(`Metadatos en vivo: "${data.title}"`);
        } else {
          setPreviewMetadata('Sin metadatos en vivo (se reproducirá sólo con el nombre de la radio)');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setPreviewMetadata(`Error al obtener metadatos: ${data.error || 'el servidor no retornó datos válidos'}`);
      }
    } catch (err: any) {
      setPreviewMetadata(`Error de red: ${err.message || 'no se pudo conectar con el servidor de metadatos'}`);
    } finally {
      setTestingMetadata(false);
    }
  };

  const getOrderedSlides = () => {
    if (!settings) return [];
    const defaultOrder = ['current', 'localForecastText', 'almanac', 'radar', 'forecast', 'continentalRadar', 'marineUv', 'airQuality', 'broadcastId'];
    const currentOrder = settings.slideOrder || defaultOrder;
    const filteredOrder = currentOrder.filter(key => key !== 'cities');
    const mergedOrder = [...filteredOrder];
    defaultOrder.forEach(key => {
      if (!mergedOrder.includes(key)) {
        mergedOrder.push(key);
      }
    });
    return mergedOrder;
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const orderList = getOrderedSlides();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderList.length) return;

    const newOrder = [...orderList];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setSettings({
      ...settings,
      slideOrder: newOrder
    });
  };

  // --- RENDERING HELPERS FOR GRID COLUMNS ---

  const renderMainCityCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#3182ce' }}>Ciudad Principal y Unidades</h2>
        
        <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1rem' }}>
            Ciudad actual activa: <strong style={{ color: '#ecc94b', fontSize: '1.1rem' }}>{settings.mainCity.name}</strong> ({settings.mainCity.country})
          </p>
          <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginTop: '0.2rem' }}>
            Coordenadas: Latitud {settings.mainCity.latitude.toFixed(4)}, Longitud {settings.mainCity.longitude.toFixed(4)}
          </p>
        </div>

        <form onSubmit={searchMainCity} className="form-group">
          <label className="form-label">Buscar nueva ciudad principal</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Santiago, Miami, Barcelona..."
              value={mainCityQuery}
              onChange={(e) => setMainCityQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={searchingMain}>
              {searchingMain ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Main City Geocoding Results */}
        {mainCityResults.length > 0 && (
          <div style={{ background: '#2d3748', borderRadius: '4px', padding: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e0', padding: '0.3rem 0.5rem', borderBottom: '1px solid #4a5568' }}>Selecciona una opción:</p>
            {mainCityResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => selectMainCity(result)}
                style={{
                  padding: '0.6rem 0.8rem',
                  cursor: 'pointer',
                  borderBottom: idx === mainCityResults.length - 1 ? 'none' : '1px solid #4a5568',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a202c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontWeight: 'bold' }}>{result.name}</span> - {result.admin1 ? `${result.admin1}, ` : ''}{result.country} 
                <span style={{ fontSize: '0.75rem', color: '#a0aec0', marginLeft: '0.5rem' }}>({result.latitude.toFixed(2)}, {result.longitude.toFixed(2)})</span>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Sistema de Unidades</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="unitSystem"
                value="metric"
                checked={settings.unitSystem === 'metric'}
                onChange={() => setSettings({ ...settings, unitSystem: 'metric' })}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              Métrico (°C, km/h, metros)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="unitSystem"
                value="imperial"
                checked={settings.unitSystem === 'imperial'}
                onChange={() => setSettings({ ...settings, unitSystem: 'imperial' })}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              Imperial (°F, mph, pies)
            </label>
          </div>
        </div>

        <div className="form-group" style={{ borderTop: '1px solid #2d3748', marginTop: '1.2rem', paddingTop: '1.2rem' }}>
          <label className="form-label">Formato de Reloj Local</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="clockFormat"
                value="24h"
                checked={settings.clockFormat !== '12h'}
                onChange={() => setSettings({ ...settings, clockFormat: '24h' })}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              24 Horas (Ej: 13:35)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="clockFormat"
                value="12h"
                checked={settings.clockFormat === '12h'}
                onChange={() => setSettings({ ...settings, clockFormat: '12h' })}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              12 Horas (Ej: 01:35 PM)
            </label>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.clockShowDate !== false}
              onChange={(e) => setSettings({ ...settings, clockShowDate: e.target.checked })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Mostrar fecha junto a la hora (Ej: 22 MAY)
          </label>
        </div>
      </section>
    );
  };

  const renderSatelliteFailureCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card" style={{ border: '2px solid #dd6b20', boxShadow: '0 0 10px rgba(221, 107, 32, 0.2)' }}>
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#dd6b20' }}>
          Simulación de Falla Satelital 📡⚠️
        </h2>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.disableWeatherForFun || false}
              onChange={(e) => setSettings({ ...settings, disableWeatherForFun: e.target.checked })}
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: settings.disableWeatherForFun ? '#dd6b20' : '#cbd5e0' }}>
              Simular Pérdida de Enlace Satelital
            </span>
          </label>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e0', marginTop: '0.5rem', lineHeight: '1.4' }}>
            Activa una simulación humorística donde se muestra un aviso pixelado de <strong>"PRONÓSTICO NO DISPONIBLE"</strong> acompañado de textos aleatorios de falla, se deshabilitan las lecturas de sensores y locuciones de voz, y parpadea un aviso en la marquesina.
          </p>
        </div>
      </section>
    );
  };

  const renderOtherCitiesCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#3182ce' }}>Clima de Otras Ciudades (Regionales)</h2>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e0', marginBottom: '1.2rem' }}>
          Estas ciudades aparecerán rotando en la sección "Otras Ciudades". Máximo sugerido: 4 a 10 ciudades.
        </p>

        <form onSubmit={searchOtherCity} className="form-group">
          <label className="form-label">Añadir ciudad a la lista</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Buenos Aires, Lima, París..."
              value={otherCityQuery}
              onChange={(e) => setOtherCityQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={searchingOther}>
              {searchingOther ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Secondary Cities Geocoding Results */}
        {otherCityResults.length > 0 && (
          <div style={{ background: '#2d3748', borderRadius: '4px', padding: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e0', padding: '0.3rem 0.5rem', borderBottom: '1px solid #4a5568' }}>Selecciona para añadir:</p>
            {otherCityResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => selectOtherCity(result)}
                style={{
                  padding: '0.6rem 0.8rem',
                  cursor: 'pointer',
                  borderBottom: idx === otherCityResults.length - 1 ? 'none' : '1px solid #4a5568',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a202c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontWeight: 'bold' }}>{result.name}</span> - {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
              </div>
            ))}
          </div>
        )}

        {/* List of Added Cities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {settings.cityList.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#a0aec0', textAlign: 'center', padding: '1rem' }}>No hay ciudades secundarias agregadas.</p>
          ) : (
            settings.cityList.map((city, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#2d3748',
                  padding: '0.6rem 1rem',
                  borderRadius: '4px',
                  borderLeft: '4px solid #3182ce'
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{city.name}</strong>{' '}
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>({city.country})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.2rem 0.5rem', background: '#4a5568', color: '#fff', fontSize: '0.8rem' }}
                    disabled={idx === 0}
                    onClick={() => moveOtherCity(idx, 'up')}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.2rem 0.5rem', background: '#4a5568', color: '#fff', fontSize: '0.8rem' }}
                    disabled={idx === settings.cityList.length - 1}
                    onClick={() => moveOtherCity(idx, 'down')}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => deleteOtherCity(idx)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    );
  };

  const renderBasicTickerCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#3182ce' }}>Mensajes en Marquesina (Ticker)</h2>
        <div className="form-group">
          <label className="form-label">Texto de la cinta inferior</label>
          <textarea
            className="form-input"
            style={{ height: '100px', resize: 'vertical', fontFamily: 'monospace' }}
            value={settings.marqueeText}
            onChange={(e) => setSettings({ ...settings, marqueeText: e.target.value })}
            placeholder="Escribe los mensajes separados por | para que aparezcan desplazándose en la parte inferior."
          />
          <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.4rem' }}>
            Consejo: Utiliza el símbolo de barra vertical (<code>|</code>) para separar mensajes.
          </p>
        </div>

        {/* Velocidad del Ticker Principal */}
        <div className="form-group" style={{ marginTop: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Velocidad de Desplazamiento del Ticker</label>
            <span style={{ fontSize: '0.85rem', color: '#ffd54f', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {(settings.marqueeSpeed || 1.0).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            style={{ width: '100%', cursor: 'pointer' }}
            value={settings.marqueeSpeed || 1.0}
            onChange={(e) => setSettings({ ...settings, marqueeSpeed: parseFloat(e.target.value) })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>
            <span>Lento (0.2x)</span>
            <span>Normal (1.0x)</span>
            <span>Rápido (3.0x)</span>
          </div>
        </div>
      </section>
    );
  };

  const renderSocialAndNewsCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#00f0ff' }}>Redes Sociales y Noticias Locales</h2>
        
        {/* Ticker Speed Slider */}
        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Velocidad del Ticker Secundario</label>
            <span style={{ fontSize: '0.85rem', color: '#ffd54f', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {(settings.subMarqueeSpeed || 1.0).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            style={{ width: '100%', cursor: 'pointer' }}
            value={settings.subMarqueeSpeed || 1.0}
            onChange={(e) => setSettings({ ...settings, subMarqueeSpeed: parseFloat(e.target.value) })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>
            <span>Lento (0.2x)</span>
            <span>Normal (1.0x)</span>
            <span>Rápido (3.0x)</span>
          </div>
        </div>

        {/* 2. Social Networks Section */}
        <div style={{ borderTop: '1px solid #2d3748', paddingTop: '1.2rem', marginTop: '1.2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#fff' }}>Cuentas de Redes Sociales</h3>
          
          {/* List of existing social networks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {(settings.socialNetworks || []).map((sn, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2d3748', padding: '0.5rem 0.8rem', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#00f0ff', fontSize: '0.85rem' }}>{sn.name}: </span>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{sn.handle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSocialNetwork(idx)}
                  className="btn btn-danger"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                >
                  Eliminar 🗑️
                </button>
              </div>
            ))}
            {(settings.socialNetworks || []).length === 0 && (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#a0aec0' }}>No hay cuentas agregadas.</p>
            )}
          </div>

          {/* Add new social network form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre Red (ej: Instagram)</label>
              <input
                type="text"
                className="form-input"
                value={newSnName}
                onChange={(e) => setNewSnName(e.target.value)}
                placeholder="Instagram"
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Usuario/Handle (ej: @WEA_ther)</label>
              <input
                type="text"
                className="form-input"
                value={newSnHandle}
                onChange={(e) => setNewSnHandle(e.target.value)}
                placeholder="@wea_ther"
              />
            </div>
            <button
              type="button"
              onClick={addSocialNetwork}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1rem' }}
            >
              Agregar ➕
            </button>
          </div>
        </div>

        {/* 3. Manual Local News Section */}
        <div style={{ borderTop: '1px solid #2d3748', paddingTop: '1.2rem', marginTop: '1.2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#fff' }}>Base de Noticias Manuales</h3>
          
          {/* List of existing manual news */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.2rem' }}>
            {(settings.localNewsList || []).map((item, idx) => {
              const locationStr = item.city || item.country
                ? `${item.city || 'Todo'}${item.city && item.country ? ', ' : ''}${item.country || ''}`
                : 'General';
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: '#2d3748', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <span style={{ fontSize: '0.75rem', color: item.city || item.country ? '#ffd54f' : '#a0aec0', fontWeight: 'bold' }}>
                      Filtro: {locationStr.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteLocalNews(idx)}
                      className="btn btn-danger"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', transform: 'translateY(-2px)' }}
                    >
                      Eliminar 🗑️
                    </button>
                  </div>
                  <p style={{ color: '#fff', fontSize: '0.85rem', margin: 0 }}>{item.text}</p>
                </div>
              );
            })}
            {(settings.localNewsList || []).length === 0 && (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#a0aec0' }}>No hay noticias locales ingresadas.</p>
            )}
          </div>

          {/* Add new manual news form */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto auto auto', gap: '0.8rem', background: '#202632', padding: '0.8rem', borderRadius: '6px', border: '1px solid #2d3748' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Texto de la Noticia</label>
              <textarea
                className="form-input"
                style={{ height: '55px', resize: 'none', fontSize: '0.9rem' }}
                value={newNewsText}
                onChange={(e) => setNewNewsText(e.target.value)}
                placeholder="Escribe el titular o noticia corta..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Ciudad (Filtro opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
                  value={newNewsCity}
                  onChange={(e) => setNewNewsCity(e.target.value)}
                  placeholder="ej: Arica"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>País (Filtro opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
                  value={newNewsCountry}
                  onChange={(e) => setNewNewsCountry(e.target.value)}
                  placeholder="ej: Chile"
                />
              </div>
              <button
                type="button"
                onClick={addLocalNews}
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
              >
                Añadir Noticia 📰
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', margin: 0, fontStyle: 'italic' }}>
              Nota: Deja Ciudad y País vacíos para que sea una noticia General/Global visible en cualquier ubicación.
            </p>
          </div>
        </div>
      </section>
    );
  };

  const renderAlertsCard = (isAdvanced: boolean) => {
    if (!settings) return null;
    if (!isAdvanced) {
      return (
        <section className="admin-card">
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#e53e3e' }}>Alertas Manuales</h2>
          <div className="form-group">
            <label className="form-label">Mensaje de Alerta Personalizado</label>
            <input
              type="text"
              className="form-input"
              value={settings.customAlert || ''}
              onChange={(e) => setSettings({ ...settings, customAlert: e.target.value })}
              placeholder="Escribe aquí un aviso severo para forzar su aparición en el canal. Déjalo en blanco para desactivar."
            />
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.4rem' }}>
              Ejemplo: ADVERTENCIA DE TORMENTA PARA EL ÁREA LOCAL HASTA LAS 8:00 PM.
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="admin-card">
        <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.2rem', color: '#e53e3e' }}>Alertas de Clima Severo</h2>
        
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enableAutoAlerts !== false}
              onChange={(e) => setSettings({ ...settings, enableAutoAlerts: e.target.checked })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            <span style={{ fontWeight: 'bold' }}>Habilitar Alertas Automáticas (Open-Meteo)</span>
          </label>
          <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem' }}>
            Detecta automáticamente tormentas eléctricas, vientos fuertes, lluvia intensa, olas de calor/frío extremo y oleajes peligrosos según las condiciones del clima actuales en la ciudad principal.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Mensaje de Alerta Manual / Personalizado</label>
          <input
            type="text"
            className="form-input"
            value={settings.customAlert || ''}
            onChange={(e) => setSettings({ ...settings, customAlert: e.target.value })}
            placeholder="Escribe aquí un aviso severo para forzar su aparición en el canal. Déjalo en blanco para desactivar."
          />
          <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.4rem' }}>
            Ejemplo: ADVERTENCIA DE TORNADO PARA EL ÁREA LOCAL HASTA LAS 6:00 PM. BUSQUE REFUGIO INMEDIATO.
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', background: '#1a202c', border: '1px solid #4a5568', padding: '1rem', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '1rem', color: '#ecc94b', marginBottom: '0.6rem', fontWeight: 'bold' }}>Alertas Activas en Tiempo Real (Vista Previa):</h3>
          {getPreviewAlerts().length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#a0aec0', fontSize: '0.9rem' }}>No hay ninguna alerta activa en este momento. El clima está estable.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {getPreviewAlerts().map((alert, idx) => (
                <div key={idx} style={{
                  background: 'rgba(229, 62, 98, 0.1)',
                  borderLeft: '4px solid #e53e3e',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '3px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#e53e3e', fontSize: '0.9rem' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e0', marginTop: '0.2rem' }}>{alert.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSlidesCard = (isAdvanced: boolean) => {
    if (!settings) return null;
    return (
      <section className="admin-card">
      <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>Presentación (Slides)</h3>
      
      <div className="form-group">
        <label className="form-label">Duración por diapositiva (segundos)</label>
        <input
          type="number"
          className="form-input"
          min="3"
          max="120"
          value={settings.slideDuration}
          onChange={(e) => setSettings({ ...settings, slideDuration: Math.max(3, parseInt(e.target.value) || 3) })}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Diapositivas Activas</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.current}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, current: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Condiciones Actuales
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.almanac}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, almanac: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Almanaque (Sol y Oleaje)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.forecast}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, forecast: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Pronóstico Extendido (5 días)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.continentalRadar || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, continentalRadar: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Radar Continental (Diapositiva)
          </label>

          {(settings.slides.continentalRadar || false) && (
            <div style={{ marginLeft: '1.6rem', marginTop: '0.4rem', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#1a202c', border: '1px solid #2d3748', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem', display: 'block' }}>Continente a escanear:</label>
                <select
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem', width: '100%' }}
                  value={settings.continentalSelected || 'south_america'}
                  onChange={(e) => setSettings({ ...settings, continentalSelected: e.target.value as any })}
                >
                  <option value="south_america">América del Sur</option>
                  <option value="north_america">América del Norte</option>
                  <option value="europe">Europa</option>
                  <option value="asia">Asia</option>
                  <option value="africa">África</option>
                  <option value="oceania">Oceanía</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem', display: 'block' }}>Velocidad de desplazamiento: {settings.continentalSpeed !== undefined ? settings.continentalSpeed : 1.0}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  style={{ width: '100%' }}
                  value={settings.continentalSpeed !== undefined ? settings.continentalSpeed : 1.0}
                  onChange={(e) => setSettings({ ...settings, continentalSpeed: parseFloat(e.target.value) })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={settings.continentalLoop !== undefined ? settings.continentalLoop : false}
                  onChange={(e) => setSettings({ ...settings, continentalLoop: e.target.checked })}
                  style={{ width: '1rem', height: '1rem' }}
                />
                Desplazamiento en bucle (ir hacia abajo y regresar hacia arriba)
              </label>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.2rem', display: 'block' }}>Zoom del mapa: {settings.continentalZoom !== undefined ? settings.continentalZoom : 4}</label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  step="1"
                  style={{ width: '100%' }}
                  value={settings.continentalZoom !== undefined ? settings.continentalZoom : 4}
                  onChange={(e) => setSettings({ ...settings, continentalZoom: parseInt(e.target.value) })}
                />
              </div>

              <div style={{ marginTop: '0.4rem' }}>
                <span className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>Previsualización en tiempo real:</span>
                <div style={{ height: '280px', width: '100%', position: 'relative' }}>
                  {(() => {
                    const continentKey = settings.continentalSelected || 'south_america';
                    const continentConfig = CONTINENTS[continentKey] || CONTINENTS.south_america;
                    const mockWeatherData = continentConfig.cities.map((city, index) => ({
                      name: city.name,
                      country: city.country,
                      latitude: city.latitude,
                      longitude: city.longitude,
                      temp: 15 + (index % 4) * 4,
                      weatherCode: index % 3,
                      pop: (index % 4) * 15
                    }));

                    return (
                      <ContinentalRadarMap
                        continentKey={continentKey}
                        weatherData={mockWeatherData}
                        slideDuration={settings.slideDuration || 12}
                        scrollSpeed={settings.continentalSpeed !== undefined ? settings.continentalSpeed : 1.0}
                        loopMode={settings.continentalLoop !== undefined ? settings.continentalLoop : false}
                        zoomLevel={settings.continentalZoom !== undefined ? settings.continentalZoom : 4}
                        radarColorScheme={settings.radarColorScheme}
                        height="280px"
                        minHeight="280px"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem' }}>
            <input
              type="checkbox"
              checked={(settings.slides as any).marineUv || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, marineUv: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Oleaje e Índice UV (Diapositiva)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem' }}>
            <input
              type="checkbox"
              checked={(settings.slides as any).airQuality || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: { ...settings.slides, airQuality: e.target.checked }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Calidad del Aire y Partículas (Diapositiva)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.radar || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: {
                  ...settings.slides,
                  radar: e.target.checked
                }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Radar Local
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.slides.localForecastText || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: {
                  ...settings.slides,
                  localForecastText: e.target.checked
                }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Pronóstico Local en Texto
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={(settings.slides as any).broadcastId || false}
              onChange={(e) => setSettings({
                ...settings,
                slides: {
                  ...settings.slides,
                  broadcastId: e.target.checked
                }
              })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Identificación de Emisora (Estilo WS4000 2005)
          </label>

          {((settings.slides as any).broadcastId || false) && (
            <div style={{ marginLeft: '1.6rem', marginTop: '0.4rem', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#1a202c', border: '1px solid #2d3748', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Ubicación Personalizada (Ciudad, Región/País)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdLocationOverride || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdLocationOverride: e.target.value })}
                  placeholder="Vacío para usar la ciudad activa (ej: Santiago, Chile)"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>ID de Clima Local (Weather ID)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdWeatherId || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdWeatherId: e.target.value })}
                  placeholder="Ej: 4275"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Número / Nombre de Canal</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdChannel || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdChannel: e.target.value })}
                  placeholder="Ej: Channel 12"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>URL del Logotipo del Operador</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdLogoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdLogoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png (vacío para ocultar)"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Texto Extra / Enlaces en Pantalla</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdExtraText || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdExtraText: e.target.value })}
                  placeholder="Ej: www.canalclima.com | @CanalClima"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Sigla de Zona Horaria (Timezone Label)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  value={settings.broadcastIdTimezone || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdTimezone: e.target.value })}
                  placeholder="Vacío para auto-detectar (ej: CLT, PST, EST)"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Texto Personalizado de Identificación (Soporta Variables)</label>
                <textarea
                  className="form-input"
                  rows={5}
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
                  value={settings.broadcastIdCustomText || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdCustomText: e.target.value })}
                  placeholder="Ej: BIENVENIDOS A LA TRANSMISIÓN EN VIVO DESDE {ciudad}...&#10;TEMPERATURA: {clima_actual}"
                />
                <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
                  Variables dinámicas: <code>{`{ciudad}`}</code>, <code>{`{pais}`}</code>, <code>{`{clima_actual}`}</code>, <code>{`{condicion}`}</code>, <code>{`{humedad}`}</code>, <code>{`{viento_velocidad}`}</code>, <code>{`{viento_direccion}`}</code>, <code>{`{presion}`}</code>, <code>{`{indice_uv}`}</code>, <code>{`{altura_olas}`}</code>, <code>{`{duracion_dia}`}</code>, <code>{`{fecha}`}</code>, <code>{`{hora}`}</code>.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Texto de Derechos de Autor (Atribuciones en Cuadro Naranja)</label>
                <textarea
                  className="form-input"
                  rows={5}
                  style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
                  value={settings.broadcastIdCopyrightText || ''}
                  onChange={(e) => setSettings({ ...settings, broadcastIdCopyrightText: e.target.value })}
                  placeholder="Ej: DERECHOS DE AUTOR:\n- MAPAS: © OPENSTREETMAP"
                />
                <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
                  Este bloque de texto se mostrará dentro de un cuadro naranja de estilo retro en la sección derecha de la pantalla de Identificación de Emisora.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdvanced && (
        <>
          <div style={{ borderTop: '1px solid #2d3748', marginTop: '1.2rem', paddingTop: '1.2rem' }}>
            <span className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Orden de Diapositivas</span>
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.8rem', lineHeight: '1.4' }}>
              Use las flechas para reorganizar el orden en que se muestran las pantallas:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getOrderedSlides().map((key, index, arr) => {
                const labelMap: Record<string, string> = {
                  current: "Condiciones Actuales",
                  localForecastText: "Pronóstico Local Texto",
                  almanac: "Almanaque",
                  radar: "Radar Local",
                  forecast: "Pronóstico Extendido",
                  continentalRadar: "Radar Continental",
                  marineUv: "Oleaje e Índice UV",
                  airQuality: "Calidad del Aire",
                  broadcastId: "Identificación Emisora (WS4000 2005)"
                };
                const isActive = settings.slides[key as keyof typeof settings.slides] !== false;

                return (
                  <div 
                    key={key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: '#1a202c', 
                      padding: '0.5rem 0.8rem', 
                      borderRadius: '4px',
                      border: '1px solid #2d3748',
                      opacity: isActive ? 1 : 0.5
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: isActive ? '#fff' : '#718096', fontWeight: 500 }}>
                      {index + 1}. {labelMap[key] || key} {!isActive && " (Desactivada)"}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, 'up')}
                        style={{
                          background: index === 0 ? '#2d3748' : '#3182ce',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === arr.length - 1}
                        onClick={() => moveSlide(index, 'down')}
                        style={{
                          background: index === arr.length - 1 ? '#2d3748' : '#3182ce',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: index === arr.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #2d3748', marginTop: '1.2rem', paddingTop: '1.2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.kioskMode || false}
                onChange={(e) => setSettings({
                  ...settings,
                  kioskMode: e.target.checked
                })}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <span style={{ fontWeight: 'bold' }}>Modo Kiosco (Kiosk Mode)</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
              Oculta los controles flotantes inferiores (Admin, silenciar música y pausa de la interfaz).
            </p>
          </div>
        </>
      )}
    </section>
    );
  };

  const renderMusicCard = (isAdvanced: boolean) => {
    if (!settings) return null;
    return (
      <section className="admin-card">
      <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>
        {isAdvanced ? "Música de Fondo (Jazz)" : "Música y Sonido"}
      </h3>
      
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.musicEnabled}
            onChange={(e) => setSettings({ ...settings, musicEnabled: e.target.checked })}
            style={{ width: '1.1rem', height: '1.1rem' }}
          />
          Activar Música de Fondo
        </label>
      </div>

      {isAdvanced && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showMusicInTicker ?? true}
              onChange={(e) => setSettings({ ...settings, showMusicInTicker: e.target.checked })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Mostrar música/radio en marquesina
          </label>
        </div>
      )}

      {isAdvanced && (settings.showMusicInTicker ?? true) && (
        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
          <label className="form-label">Tipo de información en marquesina</label>
          <select
            className="form-input"
            style={{ background: '#2d3748', border: '1px solid #4a5568' }}
            value={settings.musicTickerType || 'dynamic'}
            onChange={(e) => setSettings({ ...settings, musicTickerType: e.target.value as any })}
          >
            <option value="dynamic">Metadata dinámica en vivo (ICY/ID3)</option>
            <option value="name_only">Solo el nombre estático (Radio/Pista)</option>
          </select>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label">Volumen Inicial ({Math.round(settings.musicVolume * 100)}%)</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.musicVolume}
          onChange={(e) => setSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label font-bold">Origen de la Música</label>
        <select
          className="form-input"
          style={{ background: '#2d3748', border: '1px solid #4a5568' }}
          value={settings.musicSourceType || 'archive'}
          onChange={(e) => setSettings({ ...settings, musicSourceType: e.target.value as any })}
        >
          <option value="archive">Pistas de Archive.org (Clásico Jazz)</option>
          <option value="local">Archivos locales (Carpeta public/music/)</option>
          <option value="radio">Radio en línea (Streaming continuo)</option>
          <option value="gemini-scraper">Radio en línea (Raspado dinámico Gemini)</option>
        </select>
      </div>

      {/* Selected track/station picker - Rendered in both simple and advanced modes */}
      {(settings.musicSourceType === 'archive' || !settings.musicSourceType) && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label font-bold">Pista Activa</label>
          <select
            className="form-input"
            style={{ background: '#2d3748', border: '1px solid #4a5568' }}
            value={settings.activeMusicUrl}
            onChange={(e) => setSettings({ ...settings, activeMusicUrl: e.target.value })}
          >
            {settings.musicUrls.length === 0 ? (
              <option value="">No hay pistas disponibles</option>
            ) : (
              settings.musicUrls.map((url, idx) => (
                <option key={idx} value={url}>
                  Pista {idx + 1} ({url.substring(url.lastIndexOf('/') + 1)})
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {settings.musicSourceType === 'local' && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label font-bold">Archivo MP3 Local Activo</label>
          <select
            className="form-input"
            style={{ background: '#2d3748', border: '1px solid #4a5568' }}
            value={settings.activeLocalMusicUrl || ''}
            onChange={(e) => setSettings({ ...settings, activeLocalMusicUrl: e.target.value })}
          >
            <option value="">-- Seleccionar pista local --</option>
            {(settings.localMusicFiles || []).map((file, idx) => (
              <option key={idx} value={file}>
                {file}
              </option>
            ))}
          </select>
        </div>
      )}

      {settings.musicSourceType === 'radio' && (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label font-bold">Radio en Línea Activa</label>
          <select
            className="form-input"
            style={{ background: '#2d3748', border: '1px solid #4a5568' }}
            value={settings.activeRadioUrl || ''}
            onChange={(e) => {
              setSettings({ ...settings, activeRadioUrl: e.target.value });
              setPreviewMetadata('');
            }}
          >
            {(!settings.onlineRadios || settings.onlineRadios.length === 0) ? (
              <option value="">No hay radios configuradas</option>
            ) : (
              settings.onlineRadios.map((radio, idx) => (
                <option key={idx} value={radio.url}>
                  {radio.name} ({radio.url.substring(0, 30)}...)
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {isAdvanced && (
        <p style={{ fontSize: '0.85rem', color: '#cbd5e0', marginTop: '1rem', borderTop: '1px dashed #4a5568', paddingTop: '1rem' }}>
          ℹ️ Para añadir pistas, radios personalizadas o configurar el Scraper, ve a la pestaña de <strong>🔌 Proveedores</strong>.
        </p>
      )}
    </section>
    );
  };

  const renderBasicSoundCard = () => {
    if (!settings) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {renderMusicCard(false)}
      
      {/* Voiceover Card */}
      <section className="admin-card">
        <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>Locución (Voz TTS)</h3>
        
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.voiceoverEnabled || false}
              onChange={(e) => setSettings({ ...settings, voiceoverEnabled: e.target.checked })}
              style={{ width: '1.1rem', height: '1.1rem' }}
            />
            Activar Locución (Voiceover TTS)
          </label>
          <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
            Reporte hablado en español durante las pantallas de Clima.
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label className="form-label">Volumen de Locución ({Math.round((settings.voiceoverVolume ?? 0.8) * 100)}%)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.voiceoverVolume ?? 0.8}
            onChange={(e) => setSettings({ ...settings, voiceoverVolume: parseFloat(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </section>
    </div>
    );
  };

  const renderVoiceAndRadarCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
      <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>Locución y Radar</h3>
      
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.voiceoverEnabled || false}
            onChange={(e) => setSettings({ ...settings, voiceoverEnabled: e.target.checked })}
            style={{ width: '1.1rem', height: '1.1rem' }}
          />
          Activar Locución (Voiceover TTS)
        </label>
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
          Reproduce un reporte hablado en español durante las pantallas de Clima Actual y Pronóstico de Texto.
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label">Volumen de Locución ({Math.round((settings.voiceoverVolume ?? 0.8) * 100)}%)</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.voiceoverVolume ?? 0.8}
          onChange={(e) => setSettings({ ...settings, voiceoverVolume: parseFloat(e.target.value) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label font-bold">Capa del Radar por Defecto</label>
        <select
          className="form-input"
          style={{ background: '#2d3748', border: '1px solid #4a5568' }}
          value={settings.activeRadarType || 'precipitation'}
          onChange={(e) => setSettings({ ...settings, activeRadarType: e.target.value as any })}
        >
          <option value="precipitation">Precipitación (Lluvia en vivo - RainViewer)</option>
          <option value="wind">Viento (Flechas animadas del viento regional)</option>
          <option value="temperature">Temperatura (Temperaturas de la región)</option>
        </select>
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
          Elige la capa que se mostrará inicialmente en la diapositiva del Radar Local.
        </p>
      </div>
    </section>
    );
  };

  const renderTextSizesCard = () => {
    if (!settings) return null;
    const textSizes = settings.textSizeSettings || {};
    const masterSize = textSizes.masterSize ?? 1.0;

    const updateMaster = (val: number) => {
      setSettings({
        ...settings,
        textSizeSettings: {
          ...textSizes,
          masterSize: val
        }
      });
    };

    const updateScale = (section: keyof TextSizeSettings, key: string, val: number) => {
      const updatedSizes = {
        ...textSizes,
        [section]: {
          ...(textSizes[section] as any || {}),
          [key]: val
        }
      };
      setSettings({
        ...settings,
        textSizeSettings: updatedSizes
      });
    };

    const resetToDefault = () => {
      setSettings({
        ...settings,
        textSizeSettings: {
          masterSize: 1.0,
          current: { title: 1.0, temp: 1.0, details: 1.0 },
          localForecastText: { title: 1.0, forecast: 1.0, extended: 1.0 },
          almanac: { title: 1.0, details: 1.0 },
          radar: { title: 1.0, cardinals: 1.0 },
          forecast: { title: 1.0, dayLabel: 1.0, description: 1.0, tempMax: 1.0, tempMin: 1.0, precipitation: 1.0 },
          continentalRadar: { title: 1.0, capital: 1.0, temperature: 1.0, precipitation: 1.0 },
          marineUv: { title: 1.0, details: 1.0 },
          airQuality: { title: 1.0, details: 1.0 }
        }
      });
    };

    const renderSliderRow = (
      label: string,
      section: keyof TextSizeSettings | null,
      key: string | null,
      value: number,
      onChangeFn: (val: number) => void
    ) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.2rem' }}>
        <div style={{ flex: '1' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#e2e8f0', display: 'block' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '2' }}>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={value}
            onChange={(e) => onChangeFn(parseFloat(e.target.value))}
            style={{ flex: 1, cursor: 'pointer' }}
          />
          <span style={{ minWidth: '3.5rem', textAlign: 'right', fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#00f0ff' }}>
            {value.toFixed(2)}x
          </span>
          <button
            type="button"
            onClick={() => onChangeFn(1.0)}
            className="btn"
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              background: '#2d3748',
              color: '#a0aec0',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>
    );

    return (
      <section className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ecc94b', margin: 0 }}>
            Personalización de Texto y Títulos
          </h3>
          <button
            type="button"
            onClick={resetToDefault}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            Restaurar Todo por Defecto 🔄
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Controla la escala relativa de los textos. El tamaño final de la fuente se calcula multiplicando la escala global (Master Size) por la escala específica de cada elemento.
        </p>

        <div style={{ background: 'rgba(236, 201, 75, 0.05)', border: '1px solid rgba(236, 201, 75, 0.3)', borderRadius: '6px', padding: '1.2rem', marginBottom: '1.5rem' }}>
          {renderSliderRow(
            'ESCALA GLOBAL (MASTER SIZE)',
            null,
            null,
            masterSize,
            updateMaster
          )}
          <p style={{ fontSize: '0.75rem', color: '#ecc94b', margin: 0, marginTop: '-0.5rem' }}>
            * Afecta a todos los textos de la aplicación simultáneamente manteniendo las proporciones.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              🌤️ Condiciones Actuales
            </h4>
            {renderSliderRow('Título de Condición', 'current', 'title', textSizes.current?.title ?? 1.0, (val) => updateScale('current', 'title', val))}
            {renderSliderRow('Temperatura Principal', 'current', 'temp', textSizes.current?.temp ?? 1.0, (val) => updateScale('current', 'temp', val))}
            {renderSliderRow('Detalles (Humedad, Viento, etc.)', 'current', 'details', textSizes.current?.details ?? 1.0, (val) => updateScale('current', 'details', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              📜 Pronóstico Hoy y Mañana (Texto)
            </h4>
            {renderSliderRow('Título Superior', 'localForecastText', 'title', textSizes.localForecastText?.title ?? 1.0, (val) => updateScale('localForecastText', 'title', val))}
            {renderSliderRow('Texto del Pronóstico', 'localForecastText', 'forecast', textSizes.localForecastText?.forecast ?? 1.0, (val) => updateScale('localForecastText', 'forecast', val))}
            {renderSliderRow('Tendencia Extendida', 'localForecastText', 'extended', textSizes.localForecastText?.extended ?? 1.0, (val) => updateScale('localForecastText', 'extended', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              📅 Pronóstico Extendido (5 Días)
            </h4>
            {renderSliderRow('Título de la Pantalla', 'forecast', 'title', textSizes.forecast?.title ?? 1.0, (val) => updateScale('forecast', 'title', val))}
            {renderSliderRow('Nombre del Día', 'forecast', 'dayLabel', textSizes.forecast?.dayLabel ?? 1.0, (val) => updateScale('forecast', 'dayLabel', val))}
            {renderSliderRow('Descripción del Clima Actual', 'forecast', 'description', textSizes.forecast?.description ?? 1.0, (val) => updateScale('forecast', 'description', val))}
            {renderSliderRow('Temperatura Máxima', 'forecast', 'tempMax', textSizes.forecast?.tempMax ?? 1.0, (val) => updateScale('forecast', 'tempMax', val))}
            {renderSliderRow('Temperatura Mínima', 'forecast', 'tempMin', textSizes.forecast?.tempMin ?? 1.0, (val) => updateScale('forecast', 'tempMin', val))}
            {renderSliderRow('Texto de Precipitación (Lluvia %)', 'forecast', 'precipitation', textSizes.forecast?.precipitation ?? 1.0, (val) => updateScale('forecast', 'precipitation', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              📡 Radar Regional
            </h4>
            {renderSliderRow('Título de la Pantalla / Capa', 'radar', 'title', textSizes.radar?.title ?? 1.0, (val) => updateScale('radar', 'title', val))}
            {renderSliderRow('Puntos Cardinales (Overlay N, S, E, O)', 'radar', 'cardinals', textSizes.radar?.cardinals ?? 1.0, (val) => updateScale('radar', 'cardinals', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              🗺️ Radar Continental
            </h4>
            {renderSliderRow('Título de la Pantalla / Continente', 'continentalRadar', 'title', textSizes.continentalRadar?.title ?? 1.0, (val) => updateScale('continentalRadar', 'title', val))}
            {renderSliderRow('Nombre de Capitales/Ciudades', 'continentalRadar', 'capital', textSizes.continentalRadar?.capital ?? 1.0, (val) => updateScale('continentalRadar', 'capital', val))}
            {renderSliderRow('Tamaño de Temperaturas', 'continentalRadar', 'temperature', textSizes.continentalRadar?.temperature ?? 1.0, (val) => updateScale('continentalRadar', 'temperature', val))}
            {renderSliderRow('Tamaño de Precipitaciones (Lluvia %)', 'continentalRadar', 'precipitation', textSizes.continentalRadar?.precipitation ?? 1.0, (val) => updateScale('continentalRadar', 'precipitation', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              🌅 Almanaque Astronómico
            </h4>
            {renderSliderRow('Título de la Pantalla', 'almanac', 'title', textSizes.almanac?.title ?? 1.0, (val) => updateScale('almanac', 'title', val))}
            {renderSliderRow('Detalles (Amanecer, Atardecer, Fase Lunar)', 'almanac', 'details', textSizes.almanac?.details ?? 1.0, (val) => updateScale('almanac', 'details', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              🌊 Oleaje e Índice UV
            </h4>
            {renderSliderRow('Título de la Pantalla', 'marineUv', 'title', textSizes.marineUv?.title ?? 1.0, (val) => updateScale('marineUv', 'title', val))}
            {renderSliderRow('Detalles (Valores y Consejos)', 'marineUv', 'details', textSizes.marineUv?.details ?? 1.0, (val) => updateScale('marineUv', 'details', val))}
          </div>

          <div style={{ background: '#2d3748', borderRadius: '6px', padding: '1.2rem', border: '1px solid #4a5568' }}>
            <h4 style={{ color: '#00f0ff', borderBottom: '1px solid #4a5568', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: 0 }}>
              🍃 Calidad del Aire
            </h4>
            {renderSliderRow('Título de la Pantalla', 'airQuality', 'title', textSizes.airQuality?.title ?? 1.0, (val) => updateScale('airQuality', 'title', val))}
            {renderSliderRow('Detalles (Gases, EPA y Recomendación)', 'airQuality', 'details', textSizes.airQuality?.details ?? 1.0, (val) => updateScale('airQuality', 'details', val))}
          </div>

        </div>
      </section>
    );
  };

  const renderEffectsCard = () => {
    if (!settings) return null;
    const effects = settings.effectsSettings || {};
    const crtScanlinesEnabled = effects.crtScanlinesEnabled ?? true;
    const crtFlickerEnabled = effects.crtFlickerEnabled ?? true;
    const scanlineSweepEnabled = effects.scanlineSweepEnabled ?? true;
    const textGlowEnabled = effects.textGlowEnabled ?? true;
    const panelGlowEnabled = effects.panelGlowEnabled ?? true;

    const updateEffect = (key: keyof EffectsSettings, val: boolean) => {
      setSettings({
        ...settings,
        effectsSettings: {
          ...effects,
          [key]: val
        }
      });
    };

    const resetEffects = () => {
      setSettings({
        ...settings,
        effectsSettings: {
          crtScanlinesEnabled: true,
          crtFlickerEnabled: true,
          scanlineSweepEnabled: true,
          textGlowEnabled: true,
          panelGlowEnabled: true
        }
      });
    };

    const renderToggleRow = (
      label: string,
      description: string,
      key: keyof EffectsSettings,
      value: boolean
    ) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#2d3748', borderRadius: '6px', border: '1px solid #4a5568', marginBottom: '1rem' }}>
        <div style={{ flex: '1', paddingRight: '1rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e2e8f0', display: 'block', marginBottom: '0.2rem' }}>
            {label}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
            {description}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateEffect(key, e.target.checked)}
            style={{ width: '1.4rem', height: '1.4rem', cursor: 'pointer' }}
          />
        </label>
      </div>
    );

    return (
      <section className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ecc94b', margin: 0 }}>
            ✨ Efectos Visuales y Post-procesado
          </h3>
          <button
            type="button"
            onClick={resetEffects}
            className="btn"
            style={{
              padding: '0.3rem 0.8rem',
              fontSize: '0.85rem',
              background: '#b7791f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Restaurar Valores por Defecto
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#cbd5e0', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Controla los efectos visuales nostálgicos y de post-procesado que emulan una pantalla analógica CRT en el reporte del clima. Desactivar algunos efectos puede mejorar significativamente el rendimiento en dispositivos de gama baja.
        </p>

        <div>
          {renderToggleRow(
            'Líneas de Escaneo CRT (Scanlines)',
            'Muestra una rejilla fina de fósforo horizontal simulando la visualización nativa de un televisor antiguo.',
            'crtScanlinesEnabled',
            crtScanlinesEnabled
          )}

          {renderToggleRow(
            'Parpadeo CRT (Flicker)',
            'Aplica un leve parpadeo constante en la luminancia de la pantalla simulando el refresco analógico de fósforo.',
            'crtFlickerEnabled',
            crtFlickerEnabled
          )}

          {renderToggleRow(
            'Barrido de Línea Horizontal (Scanline Sweep)',
            'Una barra animada con una opacidad muy sutil que recorre de arriba a abajo toda la pantalla de forma infinita.',
            'scanlineSweepEnabled',
            scanlineSweepEnabled
          )}

          {renderToggleRow(
            'Efecto Neón / Brillo en Letras (Text Glow)',
            'Agrega una sombra de luz (text-shadow) en las letras del sistema simulando la emisión de luz de los monitores CRT.',
            'textGlowEnabled',
            textGlowEnabled
          )}

          {renderToggleRow(
            'Efecto Vidrio Retro / Brillo en Paneles (Panel Glow)',
            'Habilita la sombra brillante (box-shadow) en los bordes de los paneles y cajas de información traslúcidas.',
            'panelGlowEnabled',
            panelGlowEnabled
          )}
        </div>
      </section>
    );
  };

  const renderStationIdCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
      <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>
        Identificación de Emisora (Station ID)
      </h3>
      
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.stationIdEnabled || false}
            onChange={(e) => setSettings({ ...settings, stationIdEnabled: e.target.checked })}
            style={{ width: '1.1rem', height: '1.1rem' }}
          />
          Activar Identificación de Emisora al inicio
        </label>
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
          Muestra una pantalla de presentación con locución en off al sintonizar la señal antes del carrusel de clima.
        </p>
      </div>

      {settings.stationIdEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(236, 201, 75, 0.3)' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label font-bold">Nombre de la Emisora / Canal</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568' }}
              value={settings.stationIdName || ''}
              onChange={(e) => setSettings({ ...settings, stationIdName: e.target.value })}
              placeholder="Ej. WEA-ther TV IQUIQUE"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label font-bold">Proveedor de la Transmisión / Subtexto</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568' }}
              value={settings.stationIdProvider || ''}
              onChange={(e) => setSettings({ ...settings, stationIdProvider: e.target.value })}
              placeholder="Ej. SISTEMA DE TRANSMISION METEOROLOGICA LOCAL"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label font-bold">Texto de Locución en Off (TTS)</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ background: '#2d3748', border: '1px solid #4a5568', height: '80px', resize: 'vertical', fontFamily: 'sans-serif' }}
              value={settings.stationIdVoiceoverText || ''}
              onChange={(e) => setSettings({ ...settings, stationIdVoiceoverText: e.target.value })}
              placeholder="Escribe el mensaje que leerá la voz al presentarse..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label font-bold">Gráfico Retro Central</label>
            <select
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568' }}
              value={settings.stationIdGraphic || 'satellite'}
              onChange={(e) => setSettings({ ...settings, stationIdGraphic: e.target.value as any })}
            >
              <option value="satellite">Satélite Meteorológico Animado</option>
              <option value="radar">Barrido de Radar</option>
              <option value="globe">Globo Terráqueo de Red</option>
              <option value="custom">Imagen Personalizada (URL)</option>
            </select>
          </div>

          {settings.stationIdGraphic === 'custom' && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label font-bold">URL de Imagen del Logo Personalizado</label>
              <input
                type="text"
                className="form-input"
                style={{ background: '#2d3748', border: '1px solid #4a5568' }}
                value={settings.stationIdCustomGraphicUrl || ''}
                onChange={(e) => setSettings({ ...settings, stationIdCustomGraphicUrl: e.target.value })}
                placeholder="https://ejemplo.com/logo-retro.png"
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold">Duración Mínima de Carga ({settings.stationIdMinDuration || 8} segundos)</label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={settings.stationIdMinDuration || 8}
              onChange={(e) => setSettings({ ...settings, stationIdMinDuration: parseInt(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>
              La pantalla durará este tiempo mínimo, o esperará a que termine de hablar la locución si es más larga.
            </p>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #2d3748', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
        <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#ecc94b', fontWeight: 'bold' }}>
          Diapositiva de Identificación en el Carrusel (Estilo WS4000 2005)
        </h4>
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '1rem', lineHeight: '1.4' }}>
          Configura los textos y derechos de autor para la pantalla de Identificación de Emisora que se muestra periódicamente en el carrusel de clima.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Ubicación Personalizada (Ciudad, Región/País)</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdLocationOverride || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdLocationOverride: e.target.value })}
              placeholder="Vacío para usar la ciudad activa (ej: Santiago, Chile)"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>ID de Clima Local (Weather ID)</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdWeatherId || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdWeatherId: e.target.value })}
              placeholder="Ej: 4275"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Número / Nombre de Canal</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdChannel || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdChannel: e.target.value })}
              placeholder="Ej: Channel 12"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>URL del Logotipo del Operador</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdLogoUrl || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdLogoUrl: e.target.value })}
              placeholder="https://ejemplo.com/logo.png (vacío para ocultar)"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Texto Extra / Enlaces en Pantalla</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdExtraText || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdExtraText: e.target.value })}
              placeholder="Ej: www.canalclima.com | @CanalClima"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Sigla de Zona Horaria (Timezone Label)</label>
            <input
              type="text"
              className="form-input"
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
              value={settings.broadcastIdTimezone || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdTimezone: e.target.value })}
              placeholder="Vacío para auto-detectar (ej: CLT, PST, EST)"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Texto Personalizado de Identificación (Soporta Variables)</label>
            <textarea
              className="form-input"
              rows={4}
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
              value={settings.broadcastIdCustomText || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdCustomText: e.target.value })}
              placeholder="Ej: BIENVENIDOS A LA TRANSMISIÓN EN VIVO DESDE {ciudad}...&#10;TEMPERATURA: {clima_actual}"
            />
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
              Variables dinámicas: <code>{`{ciudad}`}</code>, <code>{`{pais}`}</code>, <code>{`{clima_actual}`}</code>, <code>{`{condicion}`}</code>, <code>{`{humedad}`}</code>, <code>{`{viento_velocidad}`}</code>, <code>{`{viento_direccion}`}</code>, <code>{`{presion}`}</code>, <code>{`{indice_uv}`}</code>, <code>{`{altura_olas}`}</code>, <code>{`{duracion_dia}`}</code>, <code>{`{fecha}`}</code>, <code>{`{hora}`}</code>.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label font-bold" style={{ fontSize: '0.85rem' }}>Texto de Derechos de Autor (Atribuciones en Cuadro Naranja)</label>
            <textarea
              className="form-input"
              rows={5}
              style={{ background: '#2d3748', border: '1px solid #4a5568', padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
              value={settings.broadcastIdCopyrightText || ''}
              onChange={(e) => setSettings({ ...settings, broadcastIdCopyrightText: e.target.value })}
              placeholder="Ej: DERECHOS DE AUTOR:\n- MAPAS: © OPENSTREETMAP"
            />
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
              Este bloque de texto se mostrará dentro de un cuadro naranja de estilo retro en la sección derecha de la pantalla de Identificación de Emisora.
            </p>
          </div>
        </div>
      </div>
    </section>
    );
  };

  const renderColoresYFondosCard = () => {
    if (!settings) return null;
    return (
      <section className="admin-card">
      <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>Esquema de Colores y Fondos</h3>
      
      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label font-bold">Esquema del Radar</label>
        <select
          className="form-input"
          style={{ background: '#2d3748', border: '1px solid #4a5568' }}
          value={settings.radarColorScheme || 'retro_green'}
          onChange={(e) => setSettings({ ...settings, radarColorScheme: e.target.value as any })}
        >
          <option value="retro_green">Verde Fósforo Retro (CRT original)</option>
          <option value="dark">Modo Oscuro (CartoDB Dark)</option>
          <option value="light">Modo Claro (CartoDB Light)</option>
          <option value="standard">Estándar (OpenStreetMap de colores)</option>
          <option value="satellite">Satélite (Esri World Imagery)</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label font-bold">Modo del Tema</label>
        <select
          className="form-input"
          style={{ background: '#2d3748', border: '1px solid #4a5568' }}
          value={settings.themeMode || 'auto'}
          onChange={(e) => setSettings({ ...settings, themeMode: e.target.value as any })}
        >
          <option value="auto">Automático (por horas de amanecer y atardecer)</option>
          <option value="day">Forzar Día (esquema azul/amarillo retro)</option>
          <option value="night">Forzar Noche (esquema azul oscuro/cian retro)</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label className="form-label font-bold">Transición de Tema ({settings.themeTransitionDuration ?? 2}s)</label>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={settings.themeTransitionDuration ?? 2}
          onChange={(e) => setSettings({ ...settings, themeTransitionDuration: parseFloat(e.target.value) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.2rem' }}>
          Segundos que toma desvanecer suavemente los colores entre el modo día y noche.
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.enableWeatherBackgrounds || false}
            onChange={(e) => setSettings({ ...settings, enableWeatherBackgrounds: e.target.checked })}
            style={{ width: '1.1rem', height: '1.1rem' }}
          />
          <span style={{ fontWeight: 'bold' }}>Activar Fondos de Clima Real</span>
        </label>
        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', marginLeft: '1.6rem', lineHeight: '1.4' }}>
          Muestra paisajes reales del clima y del ciclo día/noche actual en el fondo del cliente en lugar de un gradiente sólido.
        </p>
      </div>

      {settings.enableWeatherBackgrounds && (
        <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn"
            style={{
              width: '100%',
              background: '#2d3748',
              color: '#fff',
              padding: '0.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => setShowCustomBgs(prev => !prev)}
          >
            <span>URLs de Fondos Personalizadas</span>
            <span>{showCustomBgs ? '▼ Ocultar' : '► Mostrar (12)'}</span>
          </button>

          {showCustomBgs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', background: '#1a202c', padding: '0.8rem', borderRadius: '4px', maxHeight: '350px', overflowY: 'auto' }}>
              {[
                { key: 'clear_day', label: 'Despejado - Día' },
                { key: 'clear_night', label: 'Despejado - Noche' },
                { key: 'cloudy_day', label: 'Nublado - Día' },
                { key: 'cloudy_night', label: 'Nublado - Noche' },
                { key: 'rainy_day', label: 'Lluvia - Día' },
                { key: 'rainy_night', label: 'Lluvia - Noche' },
                { key: 'snowy_day', label: 'Nieve - Día' },
                { key: 'snowy_night', label: 'Nieve - Noche' },
                { key: 'stormy_day', label: 'Tormenta - Día' },
                { key: 'stormy_night', label: 'Tormenta - Noche' },
                { key: 'foggy_day', label: 'Niebla - Día' },
                { key: 'foggy_night', label: 'Niebla - Noche' }
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e0', fontWeight: 'bold' }}>{label}</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', background: '#2d3748' }}
                    placeholder="Usar por defecto (Unsplash)"
                    value={settings.customBackgrounds?.[key] || ''}
                    onChange={(e) => {
                      const customBgs = { ...(settings.customBackgrounds || {}) };
                      if (e.target.value.trim() === '') {
                        delete customBgs[key];
                      } else {
                        customBgs[key] = e.target.value.trim();
                      }
                      setSettings({ ...settings, customBackgrounds: customBgs });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
    );
  };

  const renderSidebarMediaCard = (isAdvanced: boolean) => {
    if (!settings) return null;
    const mode = settings.sidebarMediaMode || 'none';
    const streamType = settings.tvStreamType || 'hls';
    const transition = settings.slideshowTransition || 'fade';
    const slideshowFit = settings.slideshowFit || 'cover';
    const slideshowImages = settings.slideshowImages || [];

    const handleAddSlideshowImage = () => {
      if (!newSlideshowUrl.trim()) return;
      const updated = [...slideshowImages, newSlideshowUrl.trim()];
      setSettings({ ...settings, slideshowImages: updated });
      setNewSlideshowUrl('');
    };

    const handleRemoveSlideshowImage = (index: number) => {
      const updated = slideshowImages.filter((_, idx) => idx !== index);
      setSettings({ ...settings, slideshowImages: updated });
    };

    const handleToggleLocalImage = (file: string) => {
      const isSelected = slideshowImages.includes(file);
      let updated;
      if (isSelected) {
        updated = slideshowImages.filter(f => f !== file);
      } else {
        updated = [...slideshowImages, file];
      }
      setSettings({ ...settings, slideshowImages: updated });
    };

    return (
      <section className="admin-card">
        <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ecc94b' }}>
          Panel Multimedia de la Columna Derecha
        </h3>

        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
          <label className="form-label font-bold">Modo Multimedia</label>
          <select
            className="form-input"
            style={{ background: '#2d3748', border: '1px solid #4a5568' }}
            value={mode}
            onChange={(e) => setSettings({ ...settings, sidebarMediaMode: e.target.value as any })}
          >
            <option value="none">Desactivado (Reporte Regional de alto completo)</option>
            <option value="tv">Televisión por Internet (TV en Vivo / Stream)</option>
            <option value="images">Presentación de Imágenes</option>
          </select>
        </div>

        {mode === 'tv' && (
          <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '1rem' }}>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Volumen del Audio de TV ({Math.round((settings.tvStreamVolume ?? 0.5) * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.tvStreamVolume ?? 0.5}
                onChange={(e) => setSettings({ ...settings, tvStreamVolume: parseFloat(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '0.5rem' }}>
              ℹ️ Configura la URL y origen de TV en la pestaña de <strong>🔌 Proveedores</strong>.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.3rem', lineHeight: '1.4' }}>
              Nota: La música y radio de fondo se silenciarán automáticamente mientras la transmisión esté activa.
            </p>
          </div>
        )}

        {mode === 'images' && (
          <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '1rem' }}>
            {isAdvanced ? (
              <>
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label font-bold">Tipo de Transición</label>
                  <select
                    className="form-input"
                    style={{ background: '#2d3748', border: '1px solid #4a5568' }}
                    value={transition}
                    onChange={(e) => setSettings({ ...settings, slideshowTransition: e.target.value as any })}
                  >
                    <option value="fade">Desvanecimiento Suave (Fade)</option>
                    <option value="slide">Desplazamiento Lateral (Slide)</option>
                    <option value="zoom">Efecto Ken Burns (Zoom + Fade)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label font-bold">Ajuste de Imagen (Object Fit)</label>
                  <select
                    className="form-input"
                    style={{ background: '#2d3748', border: '1px solid #4a5568' }}
                    value={slideshowFit}
                    onChange={(e) => setSettings({ ...settings, slideshowFit: e.target.value as any })}
                  >
                    <option value="cover">Cover (Llenar y recortar - Sin bordes vacíos)</option>
                    <option value="contain">Contain (Mostrar completa - Puede tener barras negras)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label">Duración por Imagen ({settings.slideshowDuration ?? 5}s)</label>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={settings.slideshowDuration ?? 5}
                    onChange={(e) => setSettings({ ...settings, slideshowDuration: parseInt(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </>
            ) : null}

            {/* List and add URLs */}
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label font-bold">Imágenes Seleccionadas ({slideshowImages.length})</label>
              {slideshowImages.length > 0 ? (
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#1a202c', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4a5568', marginBottom: '0.8rem' }}>
                  {slideshowImages.map((img, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem', borderBottom: '1px solid #2d3748', fontSize: '0.85rem' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }} title={img}>
                        {img}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlideshowImage(idx)}
                        style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '0.8rem' }}>Ninguna imagen configurada.</p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#2d3748', border: '1px solid #4a5568', flex: 1 }}
                  placeholder="Pegar URL de imagen..."
                  value={newSlideshowUrl}
                  onChange={(e) => setNewSlideshowUrl(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddSlideshowImage}
                  className="btn btn-primary"
                  style={{ padding: '0 1rem' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Local images folder public/images/ */}
            {isAdvanced && settings.localSlideshowFiles && settings.localSlideshowFiles.length > 0 ? (
              <div className="form-group">
                <label className="form-label font-bold">Archivos Locales (carpeta public/images/)</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#1a202c', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4a5568' }}>
                  {settings.localSlideshowFiles.map((file, idx) => {
                    const isAdded = slideshowImages.includes(file);
                    return (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={isAdded}
                          onChange={() => handleToggleLocalImage(file)}
                        />
                        <span style={{ color: isAdded ? '#48bb78' : '#e2e8f0' }}>{file}</span>
                      </label>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.3rem' }}>
                  Sube imágenes a <code>public/images/</code> para listarlas aquí.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {isAdvanced && mode !== 'none' ? (
          <div style={{ borderTop: '1px dashed #4a5568', paddingTop: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Velocidad del Scroll de Ciudades ({settings.cityScrollSpeed ?? 30} px/s)</label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.cityScrollSpeed ?? 30}
                onChange={(e) => setSettings({ ...settings, cityScrollSpeed: parseInt(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.2rem' }}>
                Ajusta la velocidad del reporte regional de ciudades en la parte inferior.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    );
  };





  if (authStatus.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Cargando panel de administración...</div>
      </div>
    );
  }

  if (!authStatus.initialized) {
    return renderSetupView();
  }

  if (!authStatus.authenticated) {
    return renderLoginView();
  }

  return (
    <div className={`admin-container ${configMode === 'advanced' ? 'fluid' : ''}`}>

      {/* Alert Notification banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem 1.5rem',
          borderRadius: '4px',
          zIndex: 1000,
          background: notification.type === 'success' ? '#2f855a' : '#c53030',
          borderLeft: '5px solid #fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          color: '#fff',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      <header className="admin-header">
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>WEA-ther <span style={{ color: '#3182ce', fontSize: '1.2rem' }}>Panel de Control</span></h1>
          <p style={{ color: '#a0aec0', fontSize: '0.95rem', marginTop: '0.2rem' }}>Configura el sistema de transmisión del clima.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="mode-toggle-container">
            <button
              type="button"
              className={`mode-toggle-btn ${configMode === 'simple' ? 'active' : ''}`}
              onClick={() => handleConfigModeChange('simple')}
            >
              Sencillo
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${configMode === 'advanced' ? 'active' : ''}`}
              onClick={() => handleConfigModeChange('advanced')}
            >
              Avanzado
            </button>
          </div>
          <Link href="/" className="btn btn-primary" target="_blank" style={{ textDecoration: 'none' }}>
            Ver Pantalla del Clima 📺
          </Link>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            Cerrar Sesión 🔒
          </button>
        </div>
      </header>


      {configMode === 'simple' ? (
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'location' ? 'active' : ''}`}
              onClick={() => setActiveCategory('location')}
            >
              📍 Ubicación Principal
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'providers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('providers')}
            >
              🔌 Proveedores y APIs
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'slides' ? 'active' : ''}`}
              onClick={() => setActiveCategory('slides')}
            >
              📺 Diapositivas
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'sound' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sound')}
            >
              🔊 Sonido e Intro
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'ticker' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ticker')}
            >
              📰 Marquesina y Noticias
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'media' ? 'active' : ''}`}
              onClick={() => setActiveCategory('media')}
            >
              🖼️ Barra Multimedia
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveCategory('alerts')}
            >
              ⚠️ Avisos Especiales
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'textSizes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('textSizes')}
            >
              🔤 Texto y Títulos
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveCategory('effects')}
            >
              ✨ Efectos Visuales
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'security' ? 'active' : ''}`}
              onClick={() => setActiveCategory('security')}
            >
              🔒 Seguridad y Acceso
            </button>
          </aside>

          <main className="admin-main-content">
            {activeCategory === 'location' && (
              <>
                {renderMainCityCard()}
                {renderSatelliteFailureCard()}
              </>
            )}
            {activeCategory === 'providers' && renderProvidersCard()}
            {activeCategory === 'slides' && renderSlidesCard(false)}
            {activeCategory === 'sound' && renderBasicSoundCard()}
            {activeCategory === 'ticker' && (
              <>
                {renderBasicTickerCard()}
                {renderSocialAndNewsCard()}
              </>
            )}
            {activeCategory === 'media' && renderSidebarMediaCard(false)}
            {activeCategory === 'alerts' && renderAlertsCard(false)}
            {activeCategory === 'textSizes' && renderTextSizesCard()}
            {activeCategory === 'effects' && renderEffectsCard()}
            {activeCategory === 'security' && renderSecurityCard()}
          </main>
        </div>
      ) : (
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'location' ? 'active' : ''}`}
              onClick={() => setActiveCategory('location')}
            >
              📍 Ubicación Principal
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'otherCities' ? 'active' : ''}`}
              onClick={() => setActiveCategory('otherCities')}
            >
              🏙️ Ciudades Regionales
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'providers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('providers')}
            >
              🔌 Proveedores y APIs
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'slides' ? 'active' : ''}`}
              onClick={() => setActiveCategory('slides')}
            >
              📺 Diapositivas y Orden
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'music' ? 'active' : ''}`}
              onClick={() => setActiveCategory('music')}
            >
              🎵 Música de Fondo
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'voiceover' ? 'active' : ''}`}
              onClick={() => setActiveCategory('voiceover')}
            >
              🗣️ Locución y Radar
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'intro' ? 'active' : ''}`}
              onClick={() => setActiveCategory('intro')}
            >
              📡 Intro (Station ID)
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'ticker' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ticker')}
            >
              📰 Marquesina y Noticias
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveCategory('theme')}
            >
              🎨 Colores y Fondos
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'media' ? 'active' : ''}`}
              onClick={() => setActiveCategory('media')}
            >
              🖼️ Multimedia
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveCategory('alerts')}
            >
              ⚠️ Avisos y Alertas
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'textSizes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('textSizes')}
            >
              🔤 Texto y Títulos
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveCategory('effects')}
            >
              ✨ Efectos Visuales
            </button>
            <button
              type="button"
              className={`admin-sidebar-btn ${activeCategory === 'security' ? 'active' : ''}`}
              onClick={() => setActiveCategory('security')}
            >
              🔒 Seguridad y Acceso
            </button>
          </aside>

          <main className="admin-main-content">
            {activeCategory === 'location' && (
              <>
                {renderMainCityCard()}
                {renderSatelliteFailureCard()}
              </>
            )}
            {activeCategory === 'otherCities' && renderOtherCitiesCard()}
            {activeCategory === 'providers' && renderProvidersCard()}
            {activeCategory === 'slides' && renderSlidesCard(true)}
            {activeCategory === 'music' && renderMusicCard(true)}
            {activeCategory === 'voiceover' && renderVoiceAndRadarCard()}
            {activeCategory === 'intro' && renderStationIdCard()}
            {activeCategory === 'ticker' && (
              <>
                {renderBasicTickerCard()}
                {renderSocialAndNewsCard()}
              </>
            )}
            {activeCategory === 'theme' && renderColoresYFondosCard()}
            {activeCategory === 'media' && renderSidebarMediaCard(true)}
            {activeCategory === 'alerts' && renderAlertsCard(true)}
            {activeCategory === 'textSizes' && renderTextSizesCard()}
            {activeCategory === 'effects' && renderEffectsCard()}
            {activeCategory === 'security' && renderSecurityCard()}
          </main>
        </div>
      )}

      {/* Save Button floating footer */}
      <footer style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: '#1a202c',
        borderTop: '1px solid #2d3748',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Asegúrate de guardar tus cambios antes de recargar.</span>
        <button
          type="button"
          onClick={saveSettings}
          className="btn btn-success"
          style={{ fontSize: '1.1rem', padding: '0.8rem 2rem', boxShadow: '0 0 10px rgba(56, 161, 105, 0.4)' }}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración 💾'}
        </button>
      </footer>
    </div>
  );
}
