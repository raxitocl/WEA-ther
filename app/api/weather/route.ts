import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { CONTINENTS } from '../../utils/continents';

export const dynamic = 'force-dynamic';

const settingsPath = path.join(process.cwd(), 'settings.json');

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

function getWeatherDescription(code: number | null | undefined): string {
  if (code === null || code === undefined) return 'CONDICIONES VARIABLES';
  switch (code) {
    case 0: return 'DESPEJADO';
    case 1: return 'MAYORMENTE DESPEJADO';
    case 2: return 'PARCIALMENTE NUBLADO';
    case 3: return 'NUBLADO';
    case 45:
    case 48: return 'NIEBLA';
    case 51:
    case 53:
    case 55: return 'LLOVIZNA';
    case 56:
    case 57: return 'LLOVIZNA HELADA';
    case 61: return 'LLUVIA LIGERA';
    case 63: return 'LLUVIA MODERADA';
    case 65: return 'LLUVIA FUERTE';
    case 66:
    case 67: return 'LLUVIA HELADA';
    case 71: return 'NIEVE LIGERA';
    case 73: return 'NIEVE MODERADA';
    case 75: return 'NIEVE FUERTE';
    case 77: return 'GRANIZO DE NIEVE';
    case 80:
    case 81:
    case 82: return 'CHUBASCOS';
    case 85:
    case 86: return 'CHUBASCOS DE NIEVE';
    case 95: return 'TORMENTA ELÉCTRICA';
    case 96:
    case 99: return 'TORMENTA CON GRANIZO';
    default: return 'CONDICIONES VARIABLES';
  }
}

function getWindDirectionAbbr(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return 'N/A';
  const val = Math.floor((degrees / 22.5) + 0.5);
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 
    'E', 'ESE', 'SE', 'SSE', 
    'S', 'SSW', 'SW', 'WSW', 
    'W', 'WNW', 'NW', 'NNW'
  ];
  return directions[val % 16];
}

export async function GET() {
  try {
    // 1. Read settings
    const settingsData = await fs.readFile(settingsPath, 'utf8');
    const settings: Settings = JSON.parse(settingsData);
    const { mainCity, unitSystem } = settings;

    const tempUnit = unitSystem === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnit = unitSystem === 'imperial' ? 'mph' : 'kmh';
    const precipitationUnit = unitSystem === 'imperial' ? 'inch' : 'mm';
    const lengthUnit = unitSystem === 'imperial' ? 'foot' : 'meter';



    // 2. Fetch main city weather & forecast (30 mins cache revalidation)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${mainCity.latitude}&longitude=${mainCity.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index&hourly=uv_index,pressure_msl,temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipitationUnit}`;
    
    let mainCityWeather = null;
    const weatherProvider = settings.providers?.generalWeather || { type: 'default' };

    if (weatherProvider.type === 'gemini-scraper' && weatherProvider.url) {
      try {
        const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
        console.log(`Scraping weather from: ${weatherProvider.url}`);
        const html = await scrapeAndCleanHtml(weatherProvider.url, weatherProvider.cssSelector);
        
        const defaultPrompt = 
          "Extrae la información del clima actual y del pronóstico para los siguientes 7 días de la página web provista. " +
          "Devuelve un JSON estrictamente estructurado con este formato: " +
          "{\n" +
          "  \"current\": {\n" +
          "    \"temperature_2m\": número,\n" +
          "    \"relative_humidity_2m\": número,\n" +
          "    \"apparent_temperature\": número,\n" +
          "    \"is_day\": 0 o 1,\n" +
          "    \"weather_code\": código WMO de clima (número de 0 a 99),\n" +
          "    \"wind_speed_10m\": número,\n" +
          "    \"wind_direction_10m\": número (grados de 0 a 360),\n" +
          "    \"pressure_msl\": número,\n" +
          "    \"visibility\": número (metros),\n" +
          "    \"uv_index\": número\n" +
          "  },\n" +
          "  \"daily\": {\n" +
          "    \"time\": [\"AAAA-MM-DD\", ... para 7 días],\n" +
          "    \"weather_code\": [número, ... para 7 días],\n" +
          "    \"temperature_2m_max\": [número, ... para 7 días],\n" +
          "    \"temperature_2m_min\": [número, ... para 7 días],\n" +
          "    \"precipitation_probability_max\": [número de 0 a 100, ... para 7 días],\n" +
          "    \"sunrise\": [\"AAAA-MM-DDT06:00\", ... para 7 días],\n" +
          "    \"sunset\": [\"AAAA-MM-DDT18:00\", ... para 7 días]\n" +
          "  }\n" +
          "}";
        
        const prompt = weatherProvider.prompt || defaultPrompt;
        const geminiWeather = await callGeminiRaw(prompt, html);
        
        if (geminiWeather && geminiWeather.current && geminiWeather.daily) {
          // Mock hourly data if missing
          if (!geminiWeather.hourly) {
            const todayStr = geminiWeather.daily.time?.[0] || new Date().toISOString().split('T')[0];
            geminiWeather.hourly = {
              time: Array.from({ length: 24 }, (_, h) => {
                const hh = h < 10 ? '0' + h : h;
                return `${todayStr}T${hh}:00`;
              }),
              uv_index: Array.from({ length: 24 }, () => geminiWeather.current.uv_index ?? 0),
              pressure_msl: Array.from({ length: 24 }, () => geminiWeather.current.pressure_msl ?? 1013),
              temperature_2m: Array.from({ length: 24 }, (_, h) => {
                const base = geminiWeather.current.temperature_2m ?? 20;
                return base + Math.sin((h - 6) * Math.PI / 12) * 4;
              }),
              weather_code: Array.from({ length: 24 }, () => geminiWeather.current.weather_code ?? 0)
            };
          }
          mainCityWeather = geminiWeather;
        } else {
          console.error('Gemini weather response format was invalid:', geminiWeather);
        }
      } catch (e) {
        console.error('Failed to scrape or parse weather using Gemini:', e);
      }
    } else {
      try {
        const weatherRes = await fetch(weatherUrl, { next: { revalidate: 900 } });
        if (weatherRes.ok) {
          mainCityWeather = await weatherRes.json();
        } else {
          console.error('Weather API failed:', await weatherRes.text());
        }
      } catch (e) {
        console.error('Failed to fetch main weather:', e);
      }
    }



    // 3. Fetch marine/wave details. Handle land-locked errors gracefully.
    let marineData = null;
    const tideWavesProvider = settings.providers?.tideWaves || { type: 'default' };

    if (tideWavesProvider.type === 'gemini-scraper' && tideWavesProvider.url) {
      try {
        const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
        console.log(`Scraping marine/tides from: ${tideWavesProvider.url}`);
        const html = await scrapeAndCleanHtml(tideWavesProvider.url, tideWavesProvider.cssSelector);
        
        const defaultPrompt = 
          "Extrae la información sobre la altura y período de las olas (y opcionalmente dirección) de esta página web. " +
          "Devuelve un JSON estrictamente estructurado con este formato: " +
          "{\n" +
          "  \"current\": {\n" +
          "    \"waveHeight\": número (altura de ola en metros),\n" +
          "    \"wavePeriod\": número (período de ola en segundos),\n" +
          "    \"waveDir\": número (dirección en grados de 0 a 360, opcional)\n" +
          "  },\n" +
          "  \"hourly\": {\n" +
          "    \"time\": [\"AAAA-MM-DDT00:00\", ... para 24 horas],\n" +
          "    \"waveHeight\": [número, ... para 24 horas],\n" +
          "    \"wavePeriod\": [número, ... para 24 horas],\n" +
          "    \"waveDir\": [número, ... para 24 horas]\n" +
          "  }\n" +
          "}";
        
        const prompt = tideWavesProvider.prompt || defaultPrompt;
        const geminiMarine = await callGeminiRaw(prompt, html);
        
        if (geminiMarine && geminiMarine.current) {
          let waveHeightVal = geminiMarine.current.waveHeight ?? 0;
          if (unitSystem === 'imperial') {
            waveHeightVal = waveHeightVal * 3.2808399; // Convert to feet
          }
          
          let hourlyData = geminiMarine.hourly;
          if (!hourlyData) {
            const todayStr = new Date().toISOString().split('T')[0];
            hourlyData = {
              time: Array.from({ length: 24 }, (_, h) => {
                const hh = h < 10 ? '0' + h : h;
                return `${todayStr}T${hh}:00`;
              }),
              waveHeight: Array.from({ length: 24 }, () => waveHeightVal),
              wavePeriod: Array.from({ length: 24 }, () => geminiMarine.current.wavePeriod ?? 8),
              waveDir: Array.from({ length: 24 }, () => geminiMarine.current.waveDir ?? 180)
            };
          } else if (unitSystem === 'imperial' && hourlyData.waveHeight) {
            hourlyData.waveHeight = hourlyData.waveHeight.map((h: number) => h * 3.2808399);
          }
          
          marineData = {
            current: {
              waveHeight: waveHeightVal,
              wavePeriod: geminiMarine.current.wavePeriod ?? null,
              waveDir: geminiMarine.current.waveDir ?? null
            },
            hourly: hourlyData,
            waveHeight: waveHeightVal,
            wavePeriod: geminiMarine.current.wavePeriod ?? null,
            waveDir: geminiMarine.current.waveDir ?? null,
            unit: unitSystem === 'imperial' ? 'ft' : 'm'
          };
        }
      } catch (e) {
        console.error('Failed to scrape or parse marine data using Gemini:', e);
      }
    } else {
      const waveProvider = settings.waveProvider || 'tablademareas';
      if (waveProvider === 'tablademareas') {
        if (mainCity.tidePath) {
          try {
            const htmlUrl = `https://tablademareas.com/${mainCity.tidePath}`;
            const headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            };
            const htmlRes = await fetch(htmlUrl, { headers, next: { revalidate: 3600 } });
            if (htmlRes.ok) {
              const html = await htmlRes.text();
              const codeEstacion = html.match(/var\s+JS_CODIGO_ESTACION\s*=\s*["']([^"']+)["']/)?.[1];
              const latitud = html.match(/var\s+JS_LATITUD\s*=\s*["']([^"']+)["']/)?.[1];
              const longitud = html.match(/var\s+JS_LONGITUD\s*=\s*["']([^"']+)["']/)?.[1];
              const urlActual = html.match(/var\s+JS_URL_ACTUAL\s*=\s*["']([^"']+)["']/)?.[1];
              const fechaActual = html.match(/var\s+JS_FECHA_ACTUAL\s*=\s*["']([^"']+)["']/)?.[1];
              const wcacheCk = html.match(/var\s+JS_WCACHE_CK\s*=\s*["']([^"']+)["']/)?.[1];

              if (codeEstacion && latitud && longitud && urlActual && fechaActual && wcacheCk) {
                const params = `?c=${codeEstacion}&l=${latitud}&g=${longitud}&u=${urlActual}&f=${fechaActual}&x=${wcacheCk}&d=tablademareas.com`;
                const wcacheUrl = `https://io-s2.nautide.com/v003/wcache${params}`;
                const apiRes = await fetch(wcacheUrl, {
                  headers: {
                    ...headers,
                    'Referer': 'https://tablademareas.com/',
                    'Origin': 'https://tablademareas.com'
                  },
                  next: { revalidate: 1800 }
                });

                if (apiRes.ok) {
                  const data = await apiRes.json();
                  if (data && data.data2 && data.data2.weather && data.data2.weather[0]) {
                    const today = data.data2.weather[0];

                    const times = today.hourly.map((h: any) => {
                      const hourNum = Math.floor(parseInt(h.time) / 100);
                      const hourStr = (hourNum < 10 ? '0' : '') + hourNum + ':00';
                      return `${today.date}T${hourStr}`;
                    });

                    const waveHeights = today.hourly.map((h: any) => {
                      const val = parseFloat(h.sigHeight_m);
                      if (unitSystem === 'imperial') {
                        return val * 3.2808399; // Convert to feet
                      }
                      return val;
                    });

                    const wavePeriods = today.hourly.map((h: any) => parseFloat(h.swellPeriod_secs));
                    const waveDirs = today.hourly.map((h: any) => parseFloat(h.swellDir));

                    const currentHour = new Date().getHours();
                    const curHourly = today.hourly[currentHour] || today.hourly[0];

                    const curHeight = parseFloat(curHourly.sigHeight_m);
                    const waveHeightVal = unitSystem === 'imperial' ? curHeight * 3.2808399 : curHeight;
                    const wavePeriodVal = parseFloat(curHourly.swellPeriod_secs);
                    const waveDirVal = parseFloat(curHourly.swellDir);

                    marineData = {
                      current: {
                        waveHeight: waveHeightVal,
                        wavePeriod: wavePeriodVal,
                        waveDir: waveDirVal
                      },
                      hourly: {
                        time: times.slice(0, 24),
                        waveHeight: waveHeights.slice(0, 24),
                        wavePeriod: wavePeriods.slice(0, 24),
                        waveDir: waveDirs.slice(0, 24)
                      },
                      waveHeight: waveHeightVal,
                      wavePeriod: wavePeriodVal,
                      waveDir: waveDirVal,
                      unit: unitSystem === 'imperial' ? 'ft' : 'm'
                    };
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to scrape or parse tablademareas wave data:', e);
          }
        }
      } else {
        try {
          const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${mainCity.latitude}&longitude=${mainCity.longitude}&current=wave_height,wave_period,wave_direction&hourly=wave_height,wave_period,wave_direction&timezone=auto&length_unit=${lengthUnit}`;
          const marineRes = await fetch(marineUrl, { next: { revalidate: 1800 } });
          if (marineRes.ok) {
            const data = await marineRes.json();
            if (data) {
              marineData = {
                current: {
                  waveHeight: data.current?.wave_height ?? data.hourly?.wave_height?.[0] ?? null,
                  wavePeriod: data.current?.wave_period ?? data.hourly?.wave_period?.[0] ?? null,
                  waveDir: data.current?.wave_direction ?? data.hourly?.wave_direction?.[0] ?? null,
                },
                hourly: data.hourly ? {
                  time: data.hourly.time.slice(0, 24),
                  waveHeight: data.hourly.wave_height.slice(0, 24),
                  wavePeriod: data.hourly.wave_period.slice(0, 24),
                  waveDir: data.hourly.wave_direction.slice(0, 24),
                } : null,
                waveHeight: data.current?.wave_height ?? data.hourly?.wave_height?.[0] ?? null,
                wavePeriod: data.current?.wave_period ?? data.hourly?.wave_period?.[0] ?? null,
                waveDir: data.current?.wave_direction ?? data.hourly?.wave_direction?.[0] ?? null,
                unit: unitSystem === 'imperial' ? 'ft' : 'm'
              };
            }
          }
        } catch (e) {
          console.log('Main city is likely land-locked or Open-Meteo Marine call failed:', e);
        }
      }
    }

    // 4. Fetch secondary cities weather (batched request to optimize network calls)
    let otherCitiesWeather: any[] = [];
    if (settings.cityList && settings.cityList.length > 0) {
      try {
        const latitudes = settings.cityList.map(c => c.latitude).join(',');
        const longitudes = settings.cityList.map(c => c.longitude).join(',');
        const otherCitiesUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;
        
        const otherRes = await fetch(otherCitiesUrl, { next: { revalidate: 900 } });
        if (otherRes.ok) {
          const rawData = await otherRes.json();
          const rawArray = Array.isArray(rawData) ? rawData : [rawData];
          
          otherCitiesWeather = settings.cityList.map((city, index) => {
            const cityData = rawArray[index];
            return {
              name: city.name,
              country: city.country,
              temp: cityData?.current?.temperature_2m ?? null,
              weatherCode: cityData?.current?.weather_code ?? null,
              windSpeed: cityData?.current?.wind_speed_10m ?? null,
              windDir: cityData?.current?.wind_direction_10m ?? null,
            };
          });
        }
      } catch (e) {
        console.error('Failed to fetch secondary cities weather:', e);
      }
    }

    // 5. Generate weather alerts (both auto-computed and manual custom alerts)
    const alerts: Array<{ type: 'automatic' | 'manual'; title: string; description: string; severity: 'info' | 'warning' | 'danger' }> = [];

    // Custom manual alert
    if (settings.customAlert && settings.customAlert.trim() !== '') {
      alerts.push({
        type: 'manual',
        title: 'AVISO ESPECIAL',
        description: settings.customAlert.trim().toUpperCase(),
        severity: 'danger'
      });
    }

    // Auto-computed alerts (if enabled)
    if (settings.enableAutoAlerts !== false && mainCityWeather && mainCityWeather.current) {
      const cur = mainCityWeather.current;
      const windSpeed = cur.wind_speed_10m; // dynamic unit depending on unitSystem
      const apparentTemp = cur.apparent_temperature; // in celsius or fahrenheit depending on unitSystem
      const code = cur.weather_code;

      // 1. Storm/Thunderstorm warning
      if ([95, 96, 99].includes(code)) {
        alerts.push({
          type: 'automatic',
          title: 'TORMENTA ELÉCTRICA',
          description: 'SE REPORTAN TORMENTAS ELÉCTRICAS EN EL ÁREA. EVITE ACTIVIDADES AL AIRE LIBRE.',
          severity: 'danger'
        });
      }

      // 2. Heavy Rain warning
      if ([65, 82].includes(code)) {
        alerts.push({
          type: 'automatic',
          title: 'LLUVIA FUERTE',
          description: 'PRECIPITACIONES INTENSAS REGISTRADAS. RIESGO DE ACUMULACIÓN DE AGUA E INUNDACIONES LOCALES.',
          severity: 'warning'
        });
      }

      // 3. High Winds warning
      const windThreshold = unitSystem === 'imperial' ? 20 : 30;
      if (windSpeed > windThreshold) {
        alerts.push({
          type: 'automatic',
          title: 'VIENTOS FUERTES',
          description: `VIENTOS ALCANZANDO LOS ${Math.round(windSpeed)} ${windUnit}. RESGUARDE OBJETOS SUELTOS EN EL EXTERIOR.`,
          severity: 'warning'
        });
      }

      // 4. Extreme Temperature waves
      const hotThreshold = unitSystem === 'imperial' ? 95 : 35;
      if (apparentTemp > hotThreshold) {
        alerts.push({
          type: 'automatic',
          title: 'CALOR EXTREMO',
          description: `SENSACIÓN TÉRMICA MUY ELEVADA DE ${Math.round(apparentTemp)}°${unitSystem === 'imperial' ? 'F' : 'C'}. MANTÉNGASE HIDRATADO Y EVITE LA EXPOSICIÓN AL SOL.`,
          severity: 'warning'
        });
      }

      const coldThreshold = unitSystem === 'imperial' ? 32 : 0;
      if (apparentTemp < coldThreshold) {
        alerts.push({
          type: 'automatic',
          title: 'FRÍO EXTREMO',
          description: `SENSACIÓN TÉRMICA BAJO CERO DE ${Math.round(apparentTemp)}°${unitSystem === 'imperial' ? 'F' : 'C'}. PROTÉJASE DEL FRÍO Y ABRÍGUESE ADECUADAMENTE.`,
          severity: 'warning'
        });
      }

      // 5. Marine warning (high waves)
      if (marineData && marineData.waveHeight) {
        const waveHeight = marineData.waveHeight;
        const waveThreshold = unitSystem === 'imperial' ? 8 : 2.5;
        if (waveHeight > waveThreshold) {
          alerts.push({
            type: 'automatic',
            title: 'OLEAJE PELIGROSO',
            description: `MAR DE FONDO CON OLAS DE ${waveHeight.toFixed(1)} ${marineData.unit}. PRECAUCIÓN PARA EMBARCACIONES MENORES Y ACTIVIDADES COSTERAS.`,
            severity: 'warning'
          });
        }
      }
    }

    // Fetch regional radar points (N, S, E, W offsets) around the main city
    const regOffsets = [
      { name: 'Norte', lat: mainCity.latitude + 0.35, lon: mainCity.longitude },
      { name: 'Sur', lat: mainCity.latitude - 0.35, lon: mainCity.longitude },
      { name: 'Este', lat: mainCity.latitude, lon: mainCity.longitude + 0.35 },
      { name: 'Oeste', lat: mainCity.latitude, lon: mainCity.longitude - 0.35 }
    ];

    let radarPoints: any[] = [];
    try {
      const regLats = regOffsets.map(o => o.lat).join(',');
      const regLons = regOffsets.map(o => o.lon).join(',');
      const regUrl = `https://api.open-meteo.com/v1/forecast?latitude=${regLats}&longitude=${regLons}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;
      
      const regRes = await fetch(regUrl, { next: { revalidate: 900 } });
      if (regRes.ok) {
        const rawReg = await regRes.json();
        const rawRegArray = Array.isArray(rawReg) ? rawReg : [rawReg];
        
        radarPoints = regOffsets.map((pt, idx) => {
          const ptData = rawRegArray[idx];
          return {
            name: pt.name,
            latitude: pt.lat,
            longitude: pt.lon,
            temp: ptData?.current?.temperature_2m ?? null,
            weatherCode: ptData?.current?.weather_code ?? null,
            windSpeed: ptData?.current?.wind_speed_10m ?? null,
            windDir: ptData?.current?.wind_direction_10m ?? null
          };
        });
      }
    } catch (e) {
      console.error('Failed to fetch radar points:', e);
    }

    // Generate text summaries for the voiceover and "Local weather" slide
    // Generate text summaries for the voiceover and "Local weather" slide
    let localForecastText = {
      today: '',
      todayNight: '',
      tomorrow: '',
      tomorrowNight: '',
      extended: '',
      extendedNight: '',
      voiceScript: ''
    };

    if (mainCityWeather && mainCityWeather.current && mainCityWeather.daily) {
      const curTemp = mainCityWeather.current.temperature_2m;
      const curCode = mainCityWeather.current.weather_code;
      const curWindSp = mainCityWeather.current.wind_speed_10m;
      const curWindDir = mainCityWeather.current.wind_direction_10m;
      
      const tMax = mainCityWeather.daily.temperature_2m_max[0];
      const tMin = mainCityWeather.daily.temperature_2m_min[0];
      
      const tomMax = mainCityWeather.daily.temperature_2m_max[1];
      const tomMin = mainCityWeather.daily.temperature_2m_min[1];
      const tomCode = mainCityWeather.daily.weather_code[1];
      const tomPop = mainCityWeather.daily.precipitation_probability_max[1] ?? 0;
      
      const tUnit = unitSystem === 'imperial' ? 'F' : 'C';
      const wUnit = unitSystem === 'imperial' ? 'MPH' : 'KM/H';
      
      const curCond = getWeatherDescription(curCode);
      const tomCond = getWeatherDescription(tomCode);
      const curWindDirText = getWindDirectionAbbr(curWindDir);
      
      localForecastText.today = `HOY EL CLIMA ESTARÁ ${curCond}, TEMPERATURA DE ${Math.round(curTemp)}°${tUnit}. MÍNIMA DE ${Math.round(tMin)}°${tUnit} Y MÁXIMA DE ${Math.round(tMax)}°${tUnit}. VIENTOS DE ${Math.round(curWindSp)} ${wUnit} DEL ${curWindDirText}.`;
      
      // Calculate Night values using hourly forecast (indices 22, 46, 70, 94, 118 for 10 PM each day)
      let todayNightCond = curCond;
      let todayNightTemp = tMin;
      let tomNightCond = tomCond;
      let tomNightTemp = tomMin;
      let extNightCond = curCond;
      let avgNightTemp = tMin;

      if (mainCityWeather.hourly && mainCityWeather.hourly.temperature_2m && mainCityWeather.hourly.weather_code) {
        const hourly = mainCityWeather.hourly;
        
        // Today Night (10 PM)
        if (hourly.temperature_2m[22] !== undefined) {
          todayNightTemp = hourly.temperature_2m[22];
          todayNightCond = getWeatherDescription(hourly.weather_code[22] ?? curCode);
        }
        
        // Tomorrow Night (10 PM)
        if (hourly.temperature_2m[46] !== undefined) {
          tomNightTemp = hourly.temperature_2m[46];
          tomNightCond = getWeatherDescription(hourly.weather_code[46] ?? tomCode);
        }
        
        // Next 3 Nights (indices 70, 94, 118)
        const nextNightsTemps = [];
        const nextNightsCodes = [];
        if (hourly.temperature_2m[70] !== undefined) {
          nextNightsTemps.push(hourly.temperature_2m[70]);
          nextNightsCodes.push(hourly.weather_code[70]);
        }
        if (hourly.temperature_2m[94] !== undefined) {
          nextNightsTemps.push(hourly.temperature_2m[94]);
          nextNightsCodes.push(hourly.weather_code[94]);
        }
        if (hourly.temperature_2m[118] !== undefined) {
          nextNightsTemps.push(hourly.temperature_2m[118]);
          nextNightsCodes.push(hourly.weather_code[118]);
        }

        if (nextNightsTemps.length > 0) {
          avgNightTemp = nextNightsTemps.reduce((a: number, b: number) => a + b, 0) / nextNightsTemps.length;
          const nightCounts: Record<number, number> = {};
          let maxNightCount = 0;
          let mostFreqNightCode = nextNightsCodes[0];
          for (const code of nextNightsCodes) {
            nightCounts[code] = (nightCounts[code] || 0) + 1;
            if (nightCounts[code] > maxNightCount) {
              maxNightCount = nightCounts[code];
              mostFreqNightCode = code;
            }
          }
          extNightCond = getWeatherDescription(mostFreqNightCode ?? curCode);
        }
      }

      localForecastText.todayNight = `HOY EN LA NOCHE SE ESPERA CIELO ${todayNightCond}, CON UNA TEMPERATURA ALREDEDOR DE ${Math.round(todayNightTemp)}°${tUnit}.`;
      
      let tomPrecip = '';
      if (tomPop > 20) {
        tomPrecip = ` CON UN ${tomPop}% DE PROBABILIDAD DE LLUVIA.`;
      }
      localForecastText.tomorrow = `MAÑANA ESTAREMOS ANTE UN DÍA ${tomCond}, CON UNA TEMPERATURA MÍNIMA DE ${Math.round(tomMin)}°${tUnit} Y MÁXIMA DE ${Math.round(tomMax)}°${tUnit}.${tomPrecip}`;
      
      localForecastText.tomorrowNight = `MAÑANA EN LA NOCHE EL CIELO ESTARÁ ${tomNightCond}, CON UNA TEMPERATURA MÍNIMA DE ${Math.round(tomNightTemp)}°${tUnit}.`;
      
      // Extended text summary (next 3 days)
      const nextDaysMax = mainCityWeather.daily.temperature_2m_max.slice(2, 5);
      const nextDaysMin = mainCityWeather.daily.temperature_2m_min.slice(2, 5);
      const nextDaysCodes = mainCityWeather.daily.weather_code.slice(2, 5);
      
      const avgMax = Math.round(nextDaysMax.reduce((a: number, b: number) => a + b, 0) / nextDaysMax.length);
      const avgMin = Math.round(nextDaysMin.reduce((a: number, b: number) => a + b, 0) / nextDaysMin.length);
      
      // Get the most frequent weather code in next 3 days
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let mostFrequentCode = nextDaysCodes[0];
      for (const code of nextDaysCodes) {
        counts[code] = (counts[code] || 0) + 1;
        if (counts[code] > maxCount) {
          maxCount = counts[code];
          mostFrequentCode = code;
        }
      }
      const extCond = getWeatherDescription(mostFrequentCode);
      
      localForecastText.extended = `PARA LOS PRÓXIMOS DÍAS SE ESPERA CIELO ${extCond}, CON MÍNIMAS ALREDEDOR DE ${avgMin}°${tUnit} Y MÁXIMAS DE ${avgMax}°${tUnit}.`;
      localForecastText.extendedNight = `EN LAS NOCHES DE LOS PRÓXIMOS DÍAS SE PREVÉ CIELO ${extNightCond}, CON TEMPERATURAS EN TORNO A LOS ${Math.round(avgNightTemp)}°${tUnit}.`;
      
      // Complete Voice Script (more natural pronunciation)
      const prepToday = `El clima de hoy en ${mainCity.name} estará ${curCond.toLowerCase()}, con una temperatura actual de ${Math.round(curTemp)} grados. Se espera una mínima de ${Math.round(tMin)} y una máxima de ${Math.round(tMax)} grados, con vientos soplando a ${Math.round(curWindSp)} kilómetros por hora desde el ${curWindDirText.split('').join(' ')}.`;
      const prepTodayNight = `Hoy en la noche se espera cielo ${todayNightCond.toLowerCase()} con una temperatura de unos ${Math.round(todayNightTemp)} grados.`;
      const prepTomorrow = `Mañana se prevé un día ${tomCond.toLowerCase()}, con mínima de ${Math.round(tomMin)} y máxima de ${Math.round(tomMax)} grados. ${tomPop > 20 ? `Hay una probabilidad de precipitación del ${tomPop} por ciento.` : ''}`;
      const prepTomorrowNight = `Durante la noche de mañana, el cielo estará ${tomNightCond.toLowerCase()} con una temperatura de ${Math.round(tomNightTemp)} grados.`;
      const prepExt = `Para los días siguientes, tendremos principalmente cielo ${extCond.toLowerCase()}, con temperaturas mínimas promedio de ${avgMin} y máximas de ${avgMax} grados.`;
      const prepExtNight = `Y en las noches de los próximos días, se espera cielo ${extNightCond.toLowerCase()} con una media de ${Math.round(avgNightTemp)} grados.`;
      
      localForecastText.voiceScript = `${prepToday} ${prepTodayNight} ${prepTomorrow} ${prepTomorrowNight} ${prepExt} ${prepExtNight}`;
    }

    // 5.5 Fetch continental weather if active
    let continentalWeather: any[] = [];
    if (settings.slides?.continentalRadar) {
      try {
        const continentKey = settings.continentalSelected || 'south_america';
        const continentConfig = CONTINENTS[continentKey];
        if (continentConfig && continentConfig.cities.length > 0) {
          const latitudes = continentConfig.cities.map(c => c.latitude).join(',');
          const longitudes = continentConfig.cities.map(c => c.longitude).join(',');
          const continentalUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code&daily=precipitation_probability_max&forecast_days=1&temperature_unit=${tempUnit}&timezone=auto`;
          
          const contRes = await fetch(continentalUrl, { next: { revalidate: 900 } });
          if (contRes.ok) {
            const rawCont = await contRes.json();
            const rawContArray = Array.isArray(rawCont) ? rawCont : [rawCont];
            
            continentalWeather = continentConfig.cities.map((city, index) => {
              const cityData = rawContArray[index];
              return {
                name: city.name,
                country: city.country,
                latitude: city.latitude,
                longitude: city.longitude,
                temp: cityData?.current?.temperature_2m ?? null,
                weatherCode: cityData?.current?.weather_code ?? null,
                pop: cityData?.daily?.precipitation_probability_max?.[0] ?? 0
              };
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch continental weather:', e);
      }
    }



    // 5.8 Fetch air quality data if active
    let airQualityData = null;
    const airQualityProvider = settings.providers?.airQuality || { type: 'default' };

    if (settings.slides?.airQuality !== false) {
      if (airQualityProvider.type === 'gemini-scraper' && airQualityProvider.url) {
        try {
          const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
          console.log(`Scraping air quality from: ${airQualityProvider.url}`);
          const html = await scrapeAndCleanHtml(airQualityProvider.url, airQualityProvider.cssSelector);
          
          const defaultPrompt = 
            "Extrae la información sobre contaminación o calidad del aire de la página web provista (incluyendo PM2.5, PM10, Ozono O3, Dióxido de Nitrógeno NO2, Dióxido de Azufre SO2, Monóxido de Carbono CO, Polvo/Dust). " +
            "Devuelve un JSON estrictamente estructurado con este formato: " +
            "{\n" +
            "  \"current\": {\n" +
            "    \"pm2_5\": número,\n" +
            "    \"pm10\": número,\n" +
            "    \"ozone\": número,\n" +
            "    \"no2\": número,\n" +
            "    \"so2\": número,\n" +
            "    \"co\": número,\n" +
            "    \"dust\": número\n" +
            "  },\n" +
            "  \"hourly\": {\n" +
            "    \"time\": [\"AAAA-MM-DDT00:00\", ... para 24 horas],\n" +
            "    \"pm2_5\": [número, ... para 24 horas],\n" +
            "    \"pm10\": [número, ... para 24 horas],\n" +
            "    \"ozone\": [número, ... para 24 horas],\n" +
            "    \"no2\": [número, ... para 24 horas],\n" +
            "    \"so2\": [número, ... para 24 horas],\n" +
            "    \"co\": [número, ... para 24 horas],\n" +
            "    \"dust\": [número, ... para 24 horas]\n" +
            "  }\n" +
            "}";
          
          const prompt = airQualityProvider.prompt || defaultPrompt;
          const geminiAq = await callGeminiRaw(prompt, html);
          
          if (geminiAq && geminiAq.current) {
            let hourlyData = geminiAq.hourly;
            if (!hourlyData) {
              const todayStr = new Date().toISOString().split('T')[0];
              hourlyData = {
                time: Array.from({ length: 24 }, (_, h) => {
                  const hh = h < 10 ? '0' + h : h;
                  return `${todayStr}T${hh}:00`;
                }),
                pm2_5: Array.from({ length: 24 }, () => geminiAq.current.pm2_5 ?? 10),
                pm10: Array.from({ length: 24 }, () => geminiAq.current.pm10 ?? 20),
                ozone: Array.from({ length: 24 }, () => geminiAq.current.ozone ?? 30),
                no2: Array.from({ length: 24 }, () => geminiAq.current.no2 ?? 5),
                so2: Array.from({ length: 24 }, () => geminiAq.current.so2 ?? 1),
                co: Array.from({ length: 24 }, () => geminiAq.current.co ?? 200),
                dust: Array.from({ length: 24 }, () => geminiAq.current.dust ?? 0)
              };
            }
            
            airQualityData = {
              current: {
                pm2_5: geminiAq.current.pm2_5 ?? null,
                pm10: geminiAq.current.pm10 ?? null,
                ozone: geminiAq.current.ozone ?? null,
                no2: geminiAq.current.no2 ?? null,
                so2: geminiAq.current.so2 ?? null,
                co: geminiAq.current.co ?? null,
                dust: geminiAq.current.dust ?? null,
              },
              hourly: hourlyData
            };
          }
        } catch (e) {
          console.error('Failed to scrape or parse air quality data using Gemini:', e);
        }
      } else {
        try {
          const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${mainCity.latitude}&longitude=${mainCity.longitude}&current=ozone,sulphur_dioxide,nitrogen_dioxide,carbon_monoxide,pm2_5,pm10,dust&hourly=ozone,sulphur_dioxide,nitrogen_dioxide,carbon_monoxide,pm2_5,pm10,dust&domains=cams_global`;
          const airQualityRes = await fetch(airQualityUrl, { next: { revalidate: 1800 } });
          if (airQualityRes.ok) {
            const aqJson = await airQualityRes.json();
            airQualityData = {
              current: {
                pm2_5: aqJson.current?.pm2_5 ?? aqJson.hourly?.pm2_5?.[0] ?? null,
                pm10: aqJson.current?.pm10 ?? aqJson.hourly?.pm10?.[0] ?? null,
                ozone: aqJson.current?.ozone ?? aqJson.hourly?.ozone?.[0] ?? null,
                no2: aqJson.current?.nitrogen_dioxide ?? aqJson.hourly?.nitrogen_dioxide?.[0] ?? null,
                so2: aqJson.current?.sulphur_dioxide ?? aqJson.hourly?.sulphur_dioxide?.[0] ?? null,
                co: aqJson.current?.carbon_monoxide ?? aqJson.hourly?.carbon_monoxide?.[0] ?? null,
                dust: aqJson.current?.dust ?? aqJson.hourly?.dust?.[0] ?? null,
              },
              hourly: aqJson.hourly ? {
                time: aqJson.hourly.time.slice(0, 24),
                pm2_5: aqJson.hourly.pm2_5.slice(0, 24),
                pm10: aqJson.hourly.pm10.slice(0, 24),
                ozone: aqJson.hourly.ozone.slice(0, 24),
                no2: aqJson.hourly.nitrogen_dioxide.slice(0, 24),
                so2: aqJson.hourly.sulphur_dioxide.slice(0, 24),
                co: aqJson.hourly.carbon_monoxide.slice(0, 24),
                dust: aqJson.hourly.dust.slice(0, 24),
              } : null
            };
          }
        } catch (e) {
          console.error("Failed to fetch air quality data:", e);
        }
      }
    }

    // 5.9 Resolve dynamic TV and Radio URLs using Gemini Scrapers if enabled
    let resolvedTvStreamUrl = '';
    const tvProvider = settings.providers?.tvStream;
    if (tvProvider && tvProvider.type === 'gemini-scraper' && tvProvider.url) {
      try {
        const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
        console.log(`Scraping TV stream URL from: ${tvProvider.url}`);
        const html = await scrapeAndCleanHtml(tvProvider.url, tvProvider.cssSelector);
        const defaultPrompt = "Encuentra la URL de transmisión en vivo (streaming) de televisión o video (por ejemplo, con extensión .m3u8, .mpd, o dirección de stream HLS) dentro del contenido. Devuelve un JSON con el formato: { \"url\": \"dirección_url_encontrada\" }";
        const prompt = tvProvider.prompt || defaultPrompt;
        const result = await callGeminiRaw(prompt, html);
        if (result && result.url) {
          resolvedTvStreamUrl = result.url;
        }
      } catch (e) {
        console.error('Failed to scrape TV stream URL using Gemini:', e);
      }
    }

    let resolvedRadioUrl = '';
    const radioProvider = settings.providers?.radioMusic;
    if (radioProvider && radioProvider.type === 'gemini-scraper' && radioProvider.url) {
      try {
        const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
        console.log(`Scraping Radio stream URL from: ${radioProvider.url}`);
        const html = await scrapeAndCleanHtml(radioProvider.url, radioProvider.cssSelector);
        const defaultPrompt = "Encuentra la URL de transmisión de radio online o audio streaming (por ejemplo, con extensión .m3u8, .mp3, .aac, o dirección de stream HLS/Icecast) dentro del contenido. Devuelve un JSON con el formato: { \"url\": \"dirección_url_encontrada\" }";
        const prompt = radioProvider.prompt || defaultPrompt;
        const result = await callGeminiRaw(prompt, html);
        if (result && result.url) {
          resolvedRadioUrl = result.url;
        }
      } catch (e) {
        console.error('Failed to scrape Radio stream URL using Gemini:', e);
      }
    }

    // 6. Build combined response payload
    const payload = {
      settings,
      resolvedTvStreamUrl,
      resolvedRadioUrl,
      mainCity: mainCityWeather ? {
        name: mainCity.name,
        country: mainCity.country,
        current: {
          temp: mainCityWeather.current.temperature_2m,
          feelsLike: mainCityWeather.current.apparent_temperature,
          humidity: mainCityWeather.current.relative_humidity_2m,
          pressure: mainCityWeather.current.pressure_msl,
          uvIndex: mainCityWeather.current.uv_index,
          windSpeed: mainCityWeather.current.wind_speed_10m,
          windDir: mainCityWeather.current.wind_direction_10m,
          visibility: mainCityWeather.current.visibility,
          weatherCode: mainCityWeather.current.weather_code,
          isDay: mainCityWeather.current.is_day,
        },
        hourly: mainCityWeather.hourly ? {
          time: mainCityWeather.hourly.time.slice(0, 24),
          uvIndex: mainCityWeather.hourly.uv_index.slice(0, 24),
          pressure: mainCityWeather.hourly.pressure_msl.slice(0, 24),
        } : null,
        forecast: mainCityWeather.daily.time.map((timeStr: string, idx: number) => ({
          date: timeStr,
          weatherCode: mainCityWeather.daily.weather_code[idx],
          tempMax: mainCityWeather.daily.temperature_2m_max[idx],
          tempMin: mainCityWeather.daily.temperature_2m_min[idx],
          pop: mainCityWeather.daily.precipitation_probability_max[idx] ?? 0,
          sunrise: mainCityWeather.daily.sunrise[idx],
          sunset: mainCityWeather.daily.sunset[idx],
        }))
      } : null,
      marine: marineData,
      otherCities: otherCitiesWeather,
      alerts,
      radarPoints,
      localForecastText,
      continentalWeather,
      airQuality: airQualityData
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Weather fetching error:', error);
    return NextResponse.json({ error: 'Failed to fetch unified weather data: ' + error.message }, { status: 500 });
  }
}
