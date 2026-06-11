'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getWeatherDetails, getWindDirectionText } from './utils/weather-utils';

const RadarMap = dynamic(() => import('./components/RadarMap'), { ssr: false });
const SidebarMedia = dynamic(() => import('./components/SidebarMedia'), { ssr: false });
const ContinentalRadarMap = dynamic(() => import('./components/ContinentalRadarMap'), { ssr: false });

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


interface WeatherPayload {
  settings: Settings;
  mainCity: {
    name: string;
    country: string;
    current: {
      temp: number;
      feelsLike: number;
      humidity: number;
      pressure: number;
      uvIndex?: number;
      windSpeed: number;
      windDir: number;
      visibility: number;
      weatherCode: number;
      isDay: number;
    };
    hourly?: {
      time: string[];
      uvIndex: number[];
      pressure: number[];
    } | null;
    forecast: Array<{
      date: string;
      weatherCode: number;
      tempMax: number;
      tempMin: number;
      pop: number;
      sunrise: string;
      sunset: string;
    }>;
  } | null;
  marine: {
    current?: {
      waveHeight: number | null;
      wavePeriod: number | null;
      waveDir: number | null;
    } | null;
    hourly?: {
      time: string[];
      waveHeight: number[];
      wavePeriod: number[];
      waveDir: number[];
    } | null;
    waveHeight: number | null;
    wavePeriod: number | null;
    waveDir: number | null;
    unit: string;
  } | null;
  otherCities: Array<{
    name: string;
    country: string;
    temp: number;
    weatherCode: number;
    windSpeed: number;
    windDir: number;
  }>;
  alerts: Array<{
    type: 'automatic' | 'manual';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'danger';
  }>;
  radarPoints: Array<{
    name: string;
    latitude: number;
    longitude: number;
    temp: number | null;
    weatherCode: number | null;
    windSpeed: number | null;
    windDir: number | null;
  }>;
  localForecastText: {
    today: string;
    todayNight?: string;
    tomorrow: string;
    tomorrowNight?: string;
    extended: string;
    extendedNight?: string;
    voiceScript: string;
  };
  continentalWeather?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    temp: number | null;
    weatherCode: number | null;
    pop: number;
  }>;
  airQuality?: {
    current: {
      pm2_5: number | null;
      pm10: number | null;
      ozone: number | null;
      no2: number | null;
      so2: number | null;
      co: number | null;
      dust: number | null;
    };
    hourly: {
      time: string[];
      pm2_5: number[];
      pm10: number[];
      ozone: number[];
      no2: number[];
      so2: number[];
      co: number[];
      dust: number[];
    } | null;
  } | null;
  resolvedTvStreamUrl?: string;
  resolvedRadioUrl?: string;
}

const DEFAULT_WEATHER_BACKGROUNDS: Record<string, string> = {
  clear_day: "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=1200&q=80",
  clear_night: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80",
  cloudy_day: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80",
  cloudy_night: "https://images.unsplash.com/photo-1501862700950-18e4e7c4450a?auto=format&fit=crop&w=1200&q=80",
  rainy_day: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1200&q=80",
  rainy_night: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=1200&q=80",
  snowy_day: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1200&q=80",
  snowy_night: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  stormy_day: "https://images.unsplash.com/photo-1605722243979-fe0be8158232?auto=format&fit=crop&w=1200&q=80",
  stormy_night: "https://images.unsplash.com/photo-1461088945293-0c17689e48ac?auto=format&fit=crop&w=1200&q=80",
  foggy_day: "https://images.unsplash.com/photo-1494005612480-90f5079e1dcf?auto=format&fit=crop&w=1200&q=80",
  foggy_night: "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1200&q=80"
};

function getWeatherCategory(code: number | null | undefined): 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' {
  if (code === null || code === undefined) return 'clear';
  if ([0, 1].includes(code)) return 'clear';
  if ([2, 3].includes(code)) return 'cloudy';
  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  if (code >= 45 && code <= 48) return 'foggy';
  return 'clear';
}

const FAILURE_JOKES: Record<string, string[]> = {
  current: [
    "TU CONEXIÓN ES LENTA... O NUESTROS SERVIDORES ESTÁN CAÍDOS. EN TODO CASO, LOS DOS TEMEMOS LA CULPA.",
    "LOS TERMÓMETROS RETRO SE CONGELARON POR NUESTROS ALGORITMOS DE CÓDIGO. PRONÓSTICO ACTUAL: DETENIDO EN EL TIEMPO.",
    "HEMOS LANZADO UNA MONEDA PARA ADIVINAR EL CLIMA ACTUAL, PERO CAYÓ DE CANTO.",
    "EL SENSOR DE TEMPERATURA FUE SECUESTRADO POR UN GATO EN BUSCA DE CALOR.",
    "EL TERMÓMETRO DICE QUE HACE FRÍO, EL HIGRÓMETRO DICE QUE ESTÁ HÚMEDO Y EL SERVIDOR DICE '500 INTERNAL SERVER ERROR'.",
    "NUESTRA ESTACIÓN METEOROLÓGICA FUE ATACADA POR UN TORNADO DE POLVO DE CHIPS. TEMPERATURA ACTUAL: SENSACIÓN DE SILICIO.",
    "HEMOS TRATADO DE CONECTARNOS A LA VELETA DE VIENTO, PERO SE ENREDÓ EN UN HILO DE TWITTER/X.",
    "LA PRESIÓN ATMOSFÉRICA ES TAN ALTA QUE EL CABLE DE RED SE APLASTÓ Y NO DEJA PASAR LOS DATOS.",
    "EL SENSOR EXTERIOR SE SIENTE ABANDONADO Y SE HA NEGADO A MEDIR LA TEMPERATURA HASTA QUE ALGUIEN VAYA A ABRAZARLO.",
    "LOS GRADOS CENTÍGRADOS SE DIERON A LA FUGA CON LOS FAHRENHEIT. EL CLIMA SE DECLARA ANÁRQUICO."
  ],
  localForecastText: [
    "NO TENEMOS TEXTO DE PRONÓSTICO. EL OPERADOR SE QUEDÓ DORMIDO SOBRE EL TECLADO Y SOLO ESCRIBIÓ 'ZZZZZZZZZZ'.",
    "LA MÁQUINA DE ESCRIBIR ELÉCTRICA SE QUEDÓ SIN CINTA Y EL METEORÓLOGO ESTÁ APRENDIENDO CÓDIGO MORSE.",
    "EL TEXTO DE PRONÓSTICO FUE VOLADO POR VIENTOS REGIONALES DE 120 KM/H.",
    "NUESTRO REDACTOR DE TIEMPO FUE REEMPLAZADO TEMPORALMENTE POR UN LORO QUE SOLO DICE: HACE FRÍO.",
    "PRONÓSTICO EN REVISIÓN: EL METEORÓLOGO TRATÓ DE LEER LAS NUBES, PERO TIENE ASTIGMATISMO.",
    "EL TEXTO DE PRONÓSTICO FUE BORRADO ACCIDENTALMENTE CON CAFÉ POR EL JEFE DE EMISIÓN.",
    "NUESTRO ALGORITMO DE GENERACIÓN DE TEXTO DECIDIÓ QUE LA MEJOR PREDICCIÓN ES QUE MAÑANA VOLVERÁ A AMANECER.",
    "LA INTELIGENCIA ARTIFICIAL QUE REDACTA ESTE TEXTO DETECTÓ UNA NUBE CON FORMA DE GATITO Y SE DEDICÓ A CONTEMPLARLA.",
    "ERROR DE PARSING: EL CLIMA DE HOY SE ENCUENTRA EN UN BUCLE INFINITO DE 'SOLEADO CON LLUVIA DE MARIPOSAS'.",
    "SE SUPONE QUE AQUÍ IRÍA UN POEMA SOBRE EL OTOÑO, PERO EL SISTEMA SÓLO PERMITE TEXTO METEOROLÓGICO Y SE QUEDÓ EN BLANCO."
  ],
  almanac: [
    "EL ALMANAQUE NO RESPONDE. PARECE QUE EL SOL Y LA LUNA SE TOMARON EL DÍA LIBRE AL MISMO TIEMPO.",
    "LA LUNA SE NIEGA A APARECER HASTA QUE LE PAGUEMOS HORAS EXTRA DE BRILLO.",
    "LA BASE DE DATOS DE MAREAS SE INUNDÓ DEBIDO A UN DESBORDAMIENTO DE MEMORIA CACHÉ.",
    "EL SOL ESTÁ TARDANDO EN SALIR PORQUE SE QUEDÓ DORMIDO CON EL CAMBIO DE HORA.",
    "ALMANAQUE CAÍDO: EL SOL SE NEGÓ A SALIR EN NUESTRA PANTALLA HASTA QUE SE TERMINE LA TEMPORADA DE ECLIPSES.",
    "EL RELOJ DE ARENA DIGITAL SE AGRIETÓ Y LA HORA DEL AMANECER QUEDÓ EN SUSPENSO CONTINUO.",
    "LA LUNA ESTÁ EN MANTENIMIENTO POR REPOSICIÓN DE HELIO. POR FAVOR, CONSULTE SU POSICIÓN DE FORMA MANUAL MIRANDO AL CIELO.",
    "EL ALMANAQUE SE FUE DE VACACIONES A UNA ISLA TROPICAL DONDE NUNCA SE PONE EL SOL.",
    "SE DESCALIBRÓ EL HORÓSCOPO METEOROLÓGICO. NO PODEMOS CALCULAR EL AMANECER DEBIDO A COMPORTAMIENTOS IMPREDECIBLES DEL CALENDARIO.",
    "LA BASE DE DATOS DE MAREAS INDICA QUE EL AGUA ESTÁ HÚMEDA. EL RESTO DE LOS DATOS SE AHOGÓ."
  ],
  radar: [
    "ESPEREMOS QUE EL SATÉLITE NO SE HAYA CAÍDO EN EL OCÉANO PACÍFICO.",
    "NUESTRA ANTENA DE RADAR ESTÁ SIENDO USADA COMO NIDO POR PALOMAS RETRO.",
    "EL RADAR DETECTA UNA TORMENTA DE ERRORES DE CÓDIGO ACERCÁNDOSE A NUESTROS CORTAFUEGOS.",
    "SE REPORTAN CHUBASCOS DE CÓDIGOS DE ERROR 404 EN EL ÁREA DE COBERTURA DE LA ANTENA.",
    "EL RADAR SUFRIÓ UN ATAQUE DE NUBES DE AZÚCAR. LA PANTALLA ESTÁ PEGADA EN EL MODO RETRO.",
    "LA ANTENA DE RADAR ESTÁ APUNTANDO AL TECHO DEL CENTRO DE MANDO. PRONÓSTICO EN EL INTERIOR: AIRE ACONDICIONADO A 22°C.",
    "SE DETECTA UNA ANOMALÍA ELECTROMAGNÉTICA EN LA ANTENA. PROBABLEMENTE ALGUIEN ESTÁ CALENTANDO ALMUERZO EN EL MICROONDAS.",
    "LA ANIMACIÓN DE LA LLUVIA EN VIVO SE SECÓ PORQUE NO HEMOS PAGADO LA FACTURA DEL AGUA DEL SATÉLITE.",
    "EL RADAR SE REBELÓ Y DECIDIÓ QUE LA PRECIPITACIÓN TIENE FORMA DE INVASORES DEL ESPACIO.",
    "SEÑAL DEL RADAR DEBILITADA: UNA BANDADA DE RETROPÁJAROS DECIDIÓ HACER UNA REUNIÓN DE CONSORCIO EN EL EJE GIRATORIO."
  ],
  forecast: [
    "ESPERA A QUE SE RECUPERE LA CONEXIÓN CON NUESTROS SISTEMAS... POR MIENTRAS SALE DE TU CASA A VER SI NO ESTÁ LLOVIENDO.",
    "EL FUTURO ES INCIERTO. NUESTRA BOLA DE CRISTAL METEOROLÓGICA SE ESTRELLÓ CONTRA EL SUELO.",
    "LOS SERVIDORES NO QUIEREN CALCULAR EL PRONÓSTICO DE LA PRÓXIMA SEMANA PORQUE ELLOS TAMBIÉN QUIEREN FERIADO LARGO.",
    "PRONÓSTICO A 5 DÍAS: 100% PROBABILIDAD DE NADA. RECOMIENDA COMPRAR UN PARAGUAS DE DIBUJOS ANIMADOS.",
    "PRONÓSTICO A 5 DÍAS SUSPENDIDO: CUALQUIER PREDICCIÓN DE MÁS DE 24 HORAS ES CIENCIA FICCIÓN EN ESTE SERVIDOR.",
    "LOS DÍAS DE LA SEMANA SE DESORDENARON. EL PRÓXIMO MARTES SERÁ REEMPLAZADO POR UN SEGUNDO DOMINGO (OJALÁ).",
    "EL SUPERCOMPUTADOR DE PREDICCIÓN DE CLIMA SE DECLARÓ EN HUELGA DE SILICIO HASTA QUE LE INSTALEN UN VENTILADOR MÁS SILENCIOSO.",
    "NUESTRAS COMPUTADORAS TIENEN TEMPERATURA INTERNA DE 85°C. PRONÓSTICO EN LA SALA DE SERVIDORES: CALOR EXTREMO.",
    "LA PROBABILIDAD DE LLUVIA PARA LOS PRÓXIMOS DÍAS ES DIRECTAMENTE PROPORCIONAL A SI LLEVAS O NO PARAGUAS.",
    "PRONÓSTICO DE LA SEMANA: SI NO LLUEVE, ESTARÁ SECO. SI NO HACE FRÍO, ESTARÁ CÁLIDO. AGRADÉZCANOS LUEGO."
  ],
  continentalRadar: [
    "EL RADAR CONTINENTAL ESTÁ FUERA DE LÍNEA. PROBABLEMENTE EL SUPERCOMPUTADOR ESTÁ JUGANDO AL BUSCAMINAS.",
    "AMÉRICA DEL SUR SE DESPLAZÓ FUERA DEL MAPA EN NUESTRO RENDERIZADO 2D. ENVIANDO EQUIPO DE RESCATE CARTOGRÁFICO.",
    "LAS COORDENADAS CONTINENTALES FUERON SECUESTRADAS POR PIRATAS INFORMÁTICOS DE BAJA PRESIÓN.",
    "EL CONTINENTE TIENE NEBLINA DE DATOS. REINICIANDO EL COMPRESOR DE PÍXELES GEOGRÁFICOS.",
    "RADAR CONTINENTAL: EL SATÉLITE SE QUEDÓ SIN GASOLINA AL CRUZAR EL ECUADOR Y ESTÁ ESPERANDO ASISTENCIA EN RUTA.",
    "LA DERIVA CONTINENTAL SE ACELERÓ EN NUESTROS SERVIDORES Y AHORA EUROPA ESTÁ AL LADO DE COLOMBIA.",
    "EL CONTINENTE ESTÁ EN MANTENIMIENTO PROGRAMADO. POR FAVOR, APUNTE SU ANTENA A OTRO PLANETA.",
    "EL AUTO-ESCANEO CONTINENTAL SE QUEDÓ SIN BATERÍA. POR FAVOR, GIRE SU MONITOR HACIA LA IZQUIERDA PARA DESPLAZAR EL CONTINENTE.",
    "EL SATÉLITE ESTÁ EN EL HANGAR PORQUE SE LE METIÓ UNA ESTRELLA FUGAZ EN EL CARBURADOR.",
    "LAS NUBES CONTINENTALES SE NEGARON A SER DIGITALIZADAS POR CUESTIONES DE DERECHOS DE AUTOR DE LA MADRE NATURALEZA."
  ],
  marineUv: [
    "EL MONITOR DE OLEAJE ESTÁ FUERA DE RANGO. NUESTRO SENSOR DE ALTURA DE OLAS SE AHOGÓ.",
    "EL ÍNDICE UV NO SE PUDO CALCULAR PORQUE NUESTRO SENSOR SE COLOCÓ PROTECTOR SOLAR FACTOR 50.",
    "LA PRESIÓN BAROMÉTRICA FUE APLASTADA POR UN ERROR DE MEMORIA. SENSACIÓN DE PESADEZ DIGITAL.",
    "NUESTRO MAREÓGRAFO SE ENREDÓ EN UN ALGA GIGANTE Y AHORA SÓLO REPORTA LA DIVERSIÓN DE LOS PECES.",
    "LOS GRÁFICOS DE RADIACIÓN SOLAR FUERON BLOQUEADOS POR UNA SOMBRILLA VIRTUAL.",
    "LOS RAYOS ULTRAVIOLETA DECIDIERON NO SER MEDIDOS HASTA QUE BAJE LA INTENSIDAD DEL CALOR.",
    "NUESTRO BARÓMETRO ANALÓGICO SE REBELÓ Y ESTÁ MARCANDO 'TIEMPO DE SIESTA' INDEFINIDAMENTE.",
    "LAS OLAS DE MAR DE FONDO SE LLEVARON EL CABLE DE RED DE NUESTRA BOYA METEOROLÓGICA.",
    "EL SENSOR UV ESTÁ DE VACACIONES BAJO LA SOMBRA DE UNA PALMERA RETRO.",
    "LA PRESIÓN ATMOSFÉRICA SUPERÓ LA CAPACIDAD DE NUESTRO ALGORITMO. REINICIANDO ATMÓSFERA."
  ]
};

const getUvLevelText = (uv: number) => {
  if (uv <= 2) return { text: 'BAJO', color: '#00ff66', advice: 'Sin riesgo. Puede estar al aire libre.' };
  if (uv <= 5) return { text: 'MODERADO', color: '#ffff00', advice: 'Use protector solar, sombrero y lentes de sol.' };
  if (uv <= 7) return { text: 'ALTO', color: '#ff9900', advice: 'Reduzca el tiempo bajo el sol entre 11 AM y 4 PM.' };
  if (uv <= 10) return { text: 'MUY ALTO', color: '#ff3300', advice: 'Busque sombra. Protector FPS 30+, sombrero y lentes.' };
  return { text: 'EXTREMO', color: '#cc00ff', advice: 'Evite la exposición. Riesgo extremo de quemaduras.' };
};

const getAirQualityHealthWarning = (level: number) => {
  const warnings = [
    "La calidad del aire es óptima y no representa riesgos para la salud. Es completamente seguro realizar actividades al aire libre, ventilar habitaciones y disfrutar de paseos sin restricciones.",
    "La calidad del aire es aceptable, pero personas extremadamente sensibles deben vigilar la aparición de síntomas menores como tos o irritación de garganta, y reducir el esfuerzo físico vigoroso prolongado.",
    "Los niños, adultos mayores y personas con asma o problemas cardíacos deben reducir el esfuerzo prolongado o intenso al aire libre y mantener las ventanas cerradas en la medida de lo posible para evitar el aire exterior.",
    "Toda la población puede experimentar efectos adversos leves o irritación. Se recomienda suspender deportes o ejercicio al aire libre. Utilice mascarilla de protección si debe permanecer en exteriores.",
    "Alerta de salud de alto riesgo. Se aconseja suspender toda actividad física al aire libre y permanecer en espacios cerrados. Utilice purificadores de aire en el interior y evite ventilar las habitaciones.",
    "Condición de emergencia médica. Evite salir bajo cualquier circunstancia y mantenga la vivienda sellada. Si experimenta dificultad para respirar, dolor de pecho o sibilancias, busque ayuda médica de urgencia."
  ];
  return warnings[Math.max(0, Math.min(5, level))];
};

const getMarineUvWarning = (uv: number, waveHeight: number | null | undefined, unit: string = 'm') => {
  let uvSeverity = 0; // 0: bajo, 1: moderado, 2: alto, 3: muy alto, 4: extremo
  if (uv > 10) uvSeverity = 4;
  else if (uv > 7) uvSeverity = 3;
  else if (uv > 5) uvSeverity = 2;
  else if (uv > 2) uvSeverity = 1;

  let waveSeverity = 0; // 0: calmo, 1: moderado, 2: peligroso
  if (waveHeight !== undefined && waveHeight !== null) {
    const thresholdCaution = unit.toLowerCase() === 'ft' ? 6.5 : 2.0;
    const thresholdDanger = unit.toLowerCase() === 'ft' ? 10.0 : 3.0;
    if (waveHeight >= thresholdDanger) waveSeverity = 2;
    else if (waveHeight >= thresholdCaution) waveSeverity = 1;
  }

  let text = 'NIVELES NORMALES';
  let color = '#00ff66'; // green
  let advice = 'Condiciones meteorológicas óptimas. Índice UV bajo y oleaje calmo. Actividades al aire libre y navegación sin restricciones especiales.';

  if (uvSeverity === 4 || waveSeverity === 2) {
    text = 'AVISO DE RIESGO EXTREMO';
    color = '#cc00ff'; // purple / deep warning
    const uvAdv = uvSeverity === 4 ? 'Índice UV Extremo. Evite la exposición directa entre 10 AM y 4 PM. Riesgo inmediato de quemaduras.' : '';
    const waveAdv = waveSeverity === 2 ? `Oleaje Extremo de ${waveHeight?.toFixed(1)}${unit}. Prohibido el ingreso al mar y deportes náuticos por fuertes corrientes de resaca.` : '';
    advice = [uvAdv, waveAdv].filter(Boolean).join(' | ');
  } else if (uvSeverity === 3) {
    text = 'ALERTA: RIESGO MUY ALTO';
    color = '#ff3300'; // red
    const uvAdv = 'Índice UV Muy Alto. Busque la sombra, use ropa protectora, sombrero de ala ancha, lentes con filtro UV y protector solar FPS 30+.';
    const waveAdv = waveSeverity === 1 ? `Oleaje Moderado de ${waveHeight?.toFixed(1)}${unit}. Precaución en rompientes.` : '';
    advice = [uvAdv, waveAdv].filter(Boolean).join(' | ');
  } else if (uvSeverity === 2 || waveSeverity === 1) {
    text = 'ADVERTENCIA: RIESGO MODERADO';
    color = '#ff9900'; // orange
    const uvAdv = uvSeverity === 2 ? 'Índice UV Alto. Use protector solar y limite la exposición directa al sol al mediodía.' : 'Índice UV Moderado. Use protector solar básico.';
    const waveAdv = waveSeverity === 1 ? `Oleaje de ${waveHeight?.toFixed(1)}${unit}. Precaución para embarcaciones menores y nadadores principiantes.` : '';
    advice = [uvAdv, waveAdv].filter(Boolean).join(' | ');
  } else if (uvSeverity === 1) {
    text = 'RIESGO BAJO / MODERADO';
    color = '#ffff00'; // yellow
    advice = 'Índice UV Moderado. Se recomienda el uso de sombrero y gafas en exposiciones prolongadas. Oleaje sin peligro.';
  }

  return { text, color, advice };
};

interface RetroChartProps {
  title: string;
  dataPoints: number[];
  timeLabels: string[];
  color: string;
  yMax: number;
  yMin?: number;
  unit: string;
}

function RetroChart({ title, dataPoints, timeLabels, color, yMax, yMin = 0, unit }: RetroChartProps) {
  const width = 360;
  const height = 190;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const gridLines = [];
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = yMin + ((yMax - yMin) / yTicks) * i;
    const yPos = height - paddingBottom - (i / yTicks) * chartHeight;
    gridLines.push({ yPos, label: `${yVal.toFixed(1)}${unit}` });
  }

  const xIndices = [0, 6, 12, 18, 23];

  const points = dataPoints.map((val, idx) => {
    const x = paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
    const clampedVal = Math.max(yMin, Math.min(yMax, val));
    const y = height - paddingBottom - ((clampedVal - yMin) / (yMax - yMin)) * chartHeight;
    return { x, y };
  });

  const pathD = points.length > 0 
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-cyan)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ background: 'rgba(2, 4, 30, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '4px', padding: '0.4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 6px 100%',
          pointerEvents: 'none',
          zIndex: 5
        }} />
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible', fontFamily: 'var(--font-retro), monospace' }}>
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.yPos} 
                x2={width - paddingRight} 
                y2={line.yPos} 
                stroke="rgba(0, 240, 255, 0.1)" 
                strokeDasharray="2, 2" 
              />
              <text 
                x={paddingLeft - 5} 
                y={line.yPos + 3} 
                fill="rgba(255,255,255,0.6)" 
                fontSize="7" 
                textAnchor="end"
              >
                {line.label}
              </text>
            </g>
          ))}

          {xIndices.map((idx) => {
            const timeStr = timeLabels[idx] || '';
            let labelText = '';
            if (timeStr) {
              const d = new Date(timeStr);
              if (!isNaN(d.getTime())) {
                labelText = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              } else {
                labelText = timeStr;
              }
            }
            const xPos = paddingLeft + (idx / 23) * chartWidth;
            return (
              <g key={idx}>
                <line 
                  x1={xPos} 
                  y1={paddingTop} 
                  x2={xPos} 
                  y2={height - paddingBottom} 
                  stroke="rgba(0, 240, 255, 0.1)" 
                  strokeDasharray="2, 2" 
                />
                <text 
                  x={xPos} 
                  y={height - paddingBottom + 12} 
                  fill="rgba(255,255,255,0.6)" 
                  fontSize="7" 
                  textAnchor="middle"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {areaD && (
            <path 
              d={areaD} 
              fill={`url(#areaGrad-${title.replace(/\s+/g, '')})`} 
            />
          )}

          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={color} 
              strokeWidth="2" 
              style={{ filter: 'drop-shadow(0px 0px 4px ' + color + ')' }} 
            />
          )}

          <defs>
            <linearGradient id={`areaGrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

interface SystemInfoData {
  nextVersion: string;
  reactVersion: string;
  nodeVersion: string;
  platform: string;
  cpuUsage: number;
  systemMemory: {
    total: number;
    used: number;
    percent: number;
  };
  processMemory: {
    rss: number;
    heapUsed: number;
  };
  uptime: number;
}

export default function ClientPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [jokeSeed] = useState(() => Math.floor(Math.random() * 100));
  const [isPaused, setIsPaused] = useState(false);
  const [radioMetadata, setRadioMetadata] = useState<string>('');
  const [voiceoverMuted, setVoiceoverMuted] = useState(false);
  const [voiceoverSpeaking, setVoiceoverSpeaking] = useState(false);

  // Station ID states
  const [showIntroScreen, setShowIntroScreen] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const [introVoiceoverSpeaking, setIntroVoiceoverSpeaking] = useState(false);
  const [isCrtTransition, setIsCrtTransition] = useState(false);

  // Time clock display state
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);

  // Dock controls display
  const [showDock, setShowDock] = useState(true);
  const dockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const volumeFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [tvActive, setTvActive] = useState(false);
  const [musicMutedByUser, setMusicMutedByUser] = useState(false);

  // Social networks & Local news states
  const [rssNews, setRssNews] = useState<Array<{ text: string; tag: string }>>([]);

  // Sync TV active state with background music mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = tvActive || musicMutedByUser;
      // Force re-render to update mute icon on control panel
      setData((prev) => (prev ? { ...prev } : null));
    }
  }, [tvActive, musicMutedByUser]);

  // Fetch system telemetry
  useEffect(() => {
    if (!mounted) return;
    
    const fetchSystemInfo = async () => {
      try {
        const res = await fetch('/api/system-info');
        if (res.ok) {
          const data = await res.json();
          setSystemInfo(data);
        }
      } catch (e) {
        console.error("Error fetching system info:", e);
      }
    };
    
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    // Setup local clock interval
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(clockTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    };
  }, []);

  // Fetch unified weather payload from API
  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        setError(null);
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Fallo de sintonía con satélite');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión de red');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchWeather();

    // Listen for cross-tab settings updates in real time
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('wea-ther-settings');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'settings-updated') {
          console.log('Real-time settings update received. Fetching...');
          fetchWeather();
        }
      };
    }
    
    // Poll weather data every 5 minutes (300000ms)
    const pollInterval = setInterval(fetchWeather, 300000);
    return () => {
      clearInterval(pollInterval);
      if (channel) {
        channel.close();
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !data?.settings) return;
    const settings = data.settings;
    const activeUrl = data.resolvedRadioUrl || settings.activeRadioUrl;
    if (settings.musicEnabled && settings.musicSourceType === 'radio' && activeUrl && settings.musicTickerType === 'dynamic') {
      const fetchRadioMeta = async () => {
        try {
          const res = await fetch(`/api/radio-metadata?url=${encodeURIComponent(activeUrl)}`);
          if (res.ok) {
            const result = await res.json();
            if (result.title) {
              setRadioMetadata(result.title);
            } else {
              setRadioMetadata('');
            }
          }
        } catch (e) {
          console.error("Error fetching live radio metadata in slideshow:", e);
        }
      };

      fetchRadioMeta();
      const metaInterval = setInterval(fetchRadioMeta, 25000); // Poll every 25 seconds
      return () => clearInterval(metaInterval);
    } else {
      setRadioMetadata('');
    }
  }, [mounted, data?.settings?.activeRadioUrl, data?.resolvedRadioUrl, data?.settings?.musicSourceType, data?.settings?.musicTickerType, data?.settings?.musicEnabled]);

  // Compiled Ticker Items for the right-side box
  const compiledTickerItems = useMemo(() => {
    if (!data || !data.settings) return [];
    
    const settings = data.settings;
    const sourceType = settings.newsSourceType || 'mixed';
    const mainCity = data.mainCity;
    
    const items: Array<{ text: string; tag: string }> = [];
    
    // 1. Add social networks
    if (settings.socialNetworks && settings.socialNetworks.length > 0) {
      settings.socialNetworks.forEach((sn) => {
        items.push({
          text: sn.handle,
          tag: sn.name.toUpperCase()
        });
      });
    }
    
    // 2. Add local news
    const newsList: Array<{ text: string; tag: string }> = [];
    
    // Manual news from settings
    if (sourceType === 'manual' || sourceType === 'mixed') {
      if (settings.localNewsList && settings.localNewsList.length > 0) {
        // Filter manual news matching city + country
        const locationMatches = settings.localNewsList.filter((item) => {
          if (!mainCity) return false;
          const matchCity = item.city ? item.city.toLowerCase().trim() === mainCity.name.toLowerCase().trim() : false;
          const matchCountry = item.country ? item.country.toLowerCase().trim() === mainCity.country.toLowerCase().trim() : false;
          
          if (item.city) {
            return matchCity && matchCountry;
          }
          return matchCountry;
        });
        
        locationMatches.forEach((item) => {
          let tag = 'NOTICIA';
          if (item.city) {
            tag = `LOCAL: ${item.city.toUpperCase()}`;
          } else if (item.country) {
            tag = item.country.toUpperCase();
          }
          newsList.push({
            text: item.text,
            tag: tag
          });
        });
      }
    }
    
    // RSS news fetched dynamically
    if (sourceType === 'rss' || sourceType === 'mixed') {
      if (rssNews && rssNews.length > 0) {
        newsList.push(...rssNews);
      }
    }
    
    // If no news for active location, use general/global manual news as fallback
    if (newsList.length === 0 && settings.localNewsList && settings.localNewsList.length > 0) {
      const generalNews = settings.localNewsList.filter((item) => !item.city && !item.country);
      generalNews.forEach((item) => {
        newsList.push({
          text: item.text,
          tag: 'INFO'
        });
      });
    }
    
    items.push(...newsList);
    
    // Fallback if everything is empty
    if (items.length === 0) {
      items.push({
        text: 'SINTONICE PARA EL REPORTE CLIMÁTICO',
        tag: 'INFO'
      });
    }
    
    return items;
  }, [data, rssNews]);

  // Fetch RSS news based on active city/country
  useEffect(() => {
    if (!data?.mainCity?.name) return;
    const settings = data.settings;
    const sourceType = settings.newsSourceType || 'mixed';
    
    if (sourceType === 'rss' || sourceType === 'mixed') {
      const fetchRSS = async () => {
        try {
          const res = await fetch(`/api/local-news?city=${encodeURIComponent(data.mainCity!.name)}&country=${encodeURIComponent(data.mainCity!.country)}`);
          if (res.ok) {
            const result = await res.json();
            if (result.news) {
              setRssNews(result.news);
            }
          }
        } catch (e) {
          console.error("Error fetching local RSS news:", e);
        }
      };
      fetchRSS();
    } else {
      setRssNews([]);
    }
  }, [data?.mainCity?.name, data?.mainCity?.country, data?.settings?.newsSourceType]);

  // Compiled Sub-Marquee scrolling text
  const compiledSubMarqueeText = useMemo(() => {
    if (compiledTickerItems.length === 0) return '';
    return compiledTickerItems.map(item => `${item.tag}: ${item.text}`).join('   |   ');
  }, [compiledTickerItems]);

  // Dynamic duration calculation for uniform scrolling speed
  const subMarqueeDuration = useMemo(() => {
    const textLength = compiledSubMarqueeText.length || 1;
    const speed = data?.settings?.subMarqueeSpeed || 1.0;
    // 0.18 seconds per character for speed = 1.0
    // Higher speed value = lower duration = faster scroll
    return Math.max(5, (textLength * 0.18) / speed);
  }, [compiledSubMarqueeText, data?.settings?.subMarqueeSpeed]);

  // Build scrolling marquee content
  const getMarqueeText = () => {
    if (!data || !data.settings) return '';
    const settings = data.settings;
    if (settings.disableWeatherForFun) {
      return "⚠️ ALERTA RETRO: Pérdida total de telemetría. El pronóstico del tiempo se está calculando lanzando una moneda al aire. | ";
    }
    let text = settings.marqueeText || '';

    // Add playing music info if enabled
    if (settings.musicEnabled && settings.showMusicInTicker !== false) {
      let musicInfo = '';
      if (settings.musicSourceType === 'radio') {
        const currentRadio = settings.onlineRadios?.find((r) => r.url === settings.activeRadioUrl);
        const radioName = currentRadio ? currentRadio.name : 'Radio';
        if (settings.musicTickerType === 'dynamic' && radioMetadata) {
          musicInfo = `🎵 EN REPRODUCCIÓN: ${radioMetadata.toUpperCase()} (VÍA ${radioName.toUpperCase()})`;
        } else {
          musicInfo = `🎵 SINTONIZADO: ${radioName.toUpperCase()}`;
        }
      } else if (settings.musicSourceType === 'archive' && settings.activeMusicUrl) {
        const trackName = decodeURIComponent(
          settings.activeMusicUrl.substring(settings.activeMusicUrl.lastIndexOf('/') + 1)
        )
          .replace(/\.mp3/g, '')
          .toUpperCase();
        musicInfo = `🎵 EN REPRODUCCIÓN: ${trackName}`;
      } else if (settings.musicSourceType === 'local' && settings.activeLocalMusicUrl) {
        const trackName = settings.activeLocalMusicUrl.replace(/\.mp3/g, '').toUpperCase();
        musicInfo = `🎵 EN REPRODUCCIÓN PISTA LOCAL: ${trackName}`;
      }

      if (musicInfo) {
        text = `${musicInfo} | ${text}`;
      }
    }

    // Add active weather alerts to the front of marquee
    if (data.alerts && data.alerts.length > 0) {
      const alertString = data.alerts.map((a) => `⚠️ AVISO: ${a.title} - ${a.description}`).join(' | ');
      text = `${alertString} | ${text}`;
    }

    return text;
  };

  const compiledMarqueeText = getMarqueeText();
  const marqueeDuration = useMemo(() => {
    const textLength = compiledMarqueeText.length || 1;
    const speed = data?.settings?.marqueeSpeed || 1.0;
    // 0.25 seconds per character for speed = 1.0 (Higher speed = lower duration)
    return Math.max(10, (textLength * 0.25) / speed);
  }, [compiledMarqueeText, data?.settings?.marqueeSpeed]);

  // Map settings config to active slideshow list
  const getSlides = () => {
    if (!data || !data.settings) return [];
    const { slides, slideOrder } = data.settings;
    const defaultOrder = ['current', 'localForecastText', 'almanac', 'radar', 'forecast', 'continentalRadar', 'marineUv', 'airQuality', 'broadcastId'];
    const currentOrder = slideOrder || defaultOrder;
    const filteredOrder = currentOrder.filter(key => key !== 'cities');
    const order = [...filteredOrder];
    defaultOrder.forEach((key) => {
      if (!order.includes(key)) {
        order.push(key);
      }
    });

    const list: Array<{ type: string; pageIndex?: number; cities?: any[] }> = [];

    order.forEach((key) => {
      if (key === 'current' && slides.current && data.mainCity) {
        list.push({ type: 'current' });
      } else if (key === 'localForecastText' && slides.localForecastText && data.localForecastText) {
        list.push({ type: 'localForecastText' });
      } else if (key === 'almanac' && slides.almanac && data.mainCity) {
        list.push({ type: 'almanac' });
      } else if (key === 'radar' && slides.radar && data.radarPoints && data.radarPoints.length > 0) {
        list.push({ type: 'radar' });
      } else if (key === 'forecast' && slides.forecast && data.mainCity) {
        list.push({ type: 'forecast' });
      } else if (key === 'continentalRadar' && slides.continentalRadar && data.continentalWeather && data.continentalWeather.length > 0) {
        list.push({ type: 'continentalRadar' });
      } else if (key === 'marineUv' && (slides as any).marineUv && data.mainCity) {
        list.push({ type: 'marineUv' });
      } else if (key === 'airQuality' && (slides as any).airQuality && data.airQuality) {
        list.push({ type: 'airQuality' });
      } else if (key === 'broadcastId' && (slides as any).broadcastId) {
        list.push({ type: 'broadcastId' });
      }
    });

    return list;
  };

  const slides = getSlides();

  const slideTypesKey = slides.map((s) => s.type).join(',');
  const activeFailureJoke = useMemo(() => {
    if (slides.length === 0) return '';
    const activeSlide = slides[activeSlideIndex] || slides[0];
    if (!activeSlide) return '';
    const jokes = FAILURE_JOKES[activeSlide.type] || FAILURE_JOKES.current;
    const jokeIndex = (activeSlideIndex + jokeSeed) % jokes.length;
    return jokes[jokeIndex];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideIndex, jokeSeed, slideTypesKey]);

  const formattedTimeStr = useMemo(() => {
    if (!currentTime) return '';
    const format = data?.settings?.clockFormat || '24h';
    if (format === '12h') {
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } else {
      return currentTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
  }, [currentTime, data?.settings?.clockFormat]);

  const formattedDateStr = useMemo(() => {
    if (!currentTime) return '';
    const day = currentTime.getDate();
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const month = months[currentTime.getMonth()];
    return `${day} ${month}`;
  }, [currentTime]);

  // Slideshow interval progress
  useEffect(() => {
    if (slides.length === 0 || isPaused || voiceoverSpeaking || !data?.settings || showIntroScreen) return;

    const activeSlide = slides[activeSlideIndex];
    const isContinental = activeSlide?.type === 'continentalRadar';
    const baseDuration = data.settings.slideDuration || 12; // seconds
    const duration = isContinental ? Math.max(25, baseDuration * 1.8) : baseDuration;

    const intervalMs = 100;
    const increment = 100 / ((duration * 1000) / intervalMs);

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) return prev;
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slides.length, activeSlideIndex, isPaused, voiceoverSpeaking, data?.settings?.slideDuration]);

  // Handle slide transitions when progress reaches 100%
  useEffect(() => {
    if (slideProgress >= 100 && slides.length > 0) {
      setSlideProgress(0);
      setActiveSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }
  }, [slideProgress, slides.length]);

  // Ensure index index bounds safety
  useEffect(() => {
    if (slides.length > 0 && activeSlideIndex >= slides.length) {
      setActiveSlideIndex(0);
    }
  }, [slides.length, activeSlideIndex]);


  // Voiceover spoken text synthesising
  useEffect(() => {
    if (showIntroScreen) return;
    const hasSpeech = typeof window !== 'undefined' && !!window.speechSynthesis;
    if (!mounted || !unlocked || !data || !data.settings || !data.settings.voiceoverEnabled || voiceoverMuted || data.settings.disableWeatherForFun || !hasSpeech) {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      setVoiceoverSpeaking(false);
      return;
    }

    const activeSlide = slides[activeSlideIndex];
    if (!activeSlide) return;

    let textToSpeak = '';
    if (activeSlide.type === 'current') {
      textToSpeak = data.localForecastText?.today || '';
    } else if (activeSlide.type === 'localForecastText') {
      textToSpeak = data.localForecastText?.voiceScript || '';
    }

    if (textToSpeak) {
      setVoiceoverSpeaking(true);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();

      let startSafety: NodeJS.Timeout;

      const fallbackDuration = Math.max(12000, textToSpeak.split(' ').length * 600 + 4000);
      const fallbackTimer = setTimeout(() => {
        console.warn('Slideshow speech synthesis safety fallback triggered');
        setVoiceoverSpeaking(false);
      }, fallbackDuration);

      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        utterance.lang = 'es-ES';
        utterance.volume = data.settings.voiceoverVolume ?? 0.8;

        utterance.onstart = () => {
          setVoiceoverSpeaking(true);
        };
        utterance.onend = () => {
          setVoiceoverSpeaking(false);
          clearTimeout(fallbackTimer);
        };
        utterance.onerror = (e) => {
          // Log as warning rather than error to avoid disrupting development overlays on normal speech cancellations
          console.warn('SpeechSynthesis warning or interruption:', e.error || e);
          setVoiceoverSpeaking(false);
          clearTimeout(fallbackTimer);
        };

        window.speechSynthesis?.speak(utterance);

        startSafety = setTimeout(() => {
          if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
            console.warn('Slideshow speech synthesis did not start, bypassing');
            setVoiceoverSpeaking(false);
          }
        }, 1500);
      }, 700);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
        if (startSafety) clearTimeout(startSafety);
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        setVoiceoverSpeaking(false);
      };
    } else {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      setVoiceoverSpeaking(false);
    }
  }, [activeSlideIndex, voiceoverMuted, data?.settings?.voiceoverEnabled, mounted, data, slides.length, unlocked]);

  // Sync music settings (source and playback state)
  useEffect(() => {
    if (!audioRef.current || !data?.settings) return;

    const {
      musicSourceType = 'archive',
      activeMusicUrl,
      activeLocalMusicUrl,
      activeRadioUrl,
      musicEnabled
    } = data.settings;

    let targetAudioUrl = '';
    if (musicSourceType === 'archive') {
      targetAudioUrl = activeMusicUrl;
    } else if (musicSourceType === 'local' && activeLocalMusicUrl) {
      targetAudioUrl = `/music/${activeLocalMusicUrl}`;
    } else if (musicSourceType === 'radio' && activeRadioUrl) {
      targetAudioUrl = data.resolvedRadioUrl || activeRadioUrl;
    }

    if (targetAudioUrl) {
      const absoluteTargetUrl = new URL(targetAudioUrl, window.location.origin).href;
      if (audioRef.current.src !== absoluteTargetUrl) {
        audioRef.current.src = targetAudioUrl;
        audioRef.current.load();
      }
    }

    if (musicEnabled && unlocked) {
      audioRef.current.play().catch((e) => console.log('Audio autoplay blocked or failed:', e));
    } else {
      audioRef.current.pause();
    }
  }, [
    data?.settings?.musicSourceType,
    data?.settings?.activeMusicUrl,
    data?.settings?.activeLocalMusicUrl,
    data?.settings?.activeRadioUrl,
    data?.resolvedRadioUrl,
    data?.settings?.musicEnabled,
    unlocked
  ]);

  // Handle smooth background music volume transitions (fade in/out) for TTS ducking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !data?.settings) return;

    const musicVolume = data.settings.musicVolume ?? 0.5;
    const isDucked = voiceoverSpeaking || introVoiceoverSpeaking;
    
    const targetVolume = showIntroScreen 
      ? (musicVolume * 0.2) 
      : (isDucked ? (musicVolume * 0.15) : musicVolume);

    if (volumeFadeIntervalRef.current) {
      clearInterval(volumeFadeIntervalRef.current);
      volumeFadeIntervalRef.current = null;
    }

    // If audio is paused or muted, set final volume directly to avoid performance overhead
    if (audio.paused || audio.muted) {
      audio.volume = targetVolume;
      return;
    }

    const duration = 600; // 600ms fade transition
    const stepTime = 30;  // 30ms interval step
    const totalSteps = duration / stepTime;
    let currentStep = 0;
    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;

    if (Math.abs(volumeDiff) < 0.01) {
      audio.volume = targetVolume;
      return;
    }

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const nextVolume = startVolume + volumeDiff * progress;
      
      audio.volume = Math.max(0, Math.min(1, nextVolume));

      if (currentStep >= totalSteps) {
        audio.volume = targetVolume;
        if (volumeFadeIntervalRef.current === interval) {
          clearInterval(interval);
          volumeFadeIntervalRef.current = null;
        }
      }
    }, stepTime);

    volumeFadeIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      if (volumeFadeIntervalRef.current === interval) {
        volumeFadeIntervalRef.current = null;
      }
    };
  }, [voiceoverSpeaking, introVoiceoverSpeaking, showIntroScreen, data?.settings?.musicVolume]);

  // Key navigation bindings
  useEffect(() => {
    if (slides.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Unlock audio on any interaction
      if (!unlocked) {
        setUnlocked(true);
        if (audioRef.current && data?.settings?.musicEnabled) {
          audioRef.current.play().catch(() => {});
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => {
          const next = !prev;
          if (audioRef.current && data?.settings?.musicEnabled) {
            if (next) audioRef.current.pause();
            else audioRef.current.play().catch(() => {});
          }
          return next;
        });
        setSlideProgress(0);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setActiveSlideIndex((prev) => (prev + 1) % slides.length);
        setSlideProgress(0);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setActiveSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setSlideProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, unlocked, data?.settings]);

  // Dock controls mouse idle hide handler
  const handleMouseMove = () => {
    setShowDock(true);
    if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    dockTimeoutRef.current = setTimeout(() => {
      setShowDock(false);
    }, 4000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    setMusicMutedByUser((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next || tvActive;
      }
      return next;
    });
  };

  const handleUnlock = () => {
    setUnlocked(true);
    const hasStationId = data?.settings?.stationIdEnabled;
    if (hasStationId) {
      setShowIntroScreen(true);
      setIntroProgress(0);
      setIntroVoiceoverSpeaking(true);
    }
    if (audioRef.current && data?.settings?.musicEnabled) {
      const initialVol = hasStationId ? (data.settings.musicVolume * 0.2) : data.settings.musicVolume;
      audioRef.current.volume = initialVol;
      audioRef.current.play().catch((e) => console.log('Failed to play on click:', e));
    }
  };

  // Station ID Intro Sequence Effects
  useEffect(() => {
    if (!unlocked || !showIntroScreen || !data?.settings) return;

    const settings = data.settings;
    const hasSpeech = typeof window !== 'undefined' && !!window.speechSynthesis;
    
    // 1. Play SpeechSynthesis for Station ID
    if (settings.voiceoverEnabled && settings.stationIdVoiceoverText && hasSpeech) {
      window.speechSynthesis.cancel();
      
      let startSafety: NodeJS.Timeout;

      const fallbackDuration = Math.max(
        (settings.stationIdMinDuration || 8) * 1000 + 4000,
        (settings.stationIdVoiceoverText || '').split(' ').length * 600 + 4000
      );
      
      const fallbackTimer = setTimeout(() => {
        console.warn('Station ID speech synthesis safety fallback triggered');
        setIntroVoiceoverSpeaking(false);
      }, fallbackDuration);
      
      const speakTimer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(settings.stationIdVoiceoverText || '');
        utterance.lang = 'es-ES';
        utterance.volume = settings.voiceoverVolume ?? 0.8;
        
        utterance.onstart = () => {
          setIntroVoiceoverSpeaking(true);
        };
        utterance.onend = () => {
          setIntroVoiceoverSpeaking(false);
          clearTimeout(fallbackTimer);
        };
        utterance.onerror = (e) => {
          console.error('Intro SpeechSynthesis error:', e);
          setIntroVoiceoverSpeaking(false);
          clearTimeout(fallbackTimer);
        };
        
        window.speechSynthesis.speak(utterance);

        startSafety = setTimeout(() => {
          if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
            console.warn('Station ID speech synthesis did not start, bypassing');
            setIntroVoiceoverSpeaking(false);
          }
        }, 1500);
      }, 500);
      
      return () => {
        clearTimeout(speakTimer);
        clearTimeout(fallbackTimer);
        if (startSafety) clearTimeout(startSafety);
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        setIntroVoiceoverSpeaking(false);
      };
    } else {
      setIntroVoiceoverSpeaking(false);
    }
  }, [unlocked, showIntroScreen, data?.settings?.stationIdVoiceoverText, data?.settings?.voiceoverEnabled, data?.settings?.voiceoverVolume]);

  // Buffer progress timer
  useEffect(() => {
    if (!unlocked || !showIntroScreen || !data?.settings) return;
    
    const settings = data.settings;
    const durationMs = (settings.stationIdMinDuration || 8) * 1000;
    const intervalMs = 50;
    const increment = 100 / (durationMs / intervalMs);
    
    const progressTimer = setInterval(() => {
      setIntroProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + increment);
      });
    }, intervalMs);

    return () => clearInterval(progressTimer);
  }, [unlocked, showIntroScreen, data?.settings?.stationIdMinDuration]);

  // Transition controller
  useEffect(() => {
    if (showIntroScreen && introProgress >= 100 && !introVoiceoverSpeaking) {
      setIsCrtTransition(true);
    }
  }, [showIntroScreen, introProgress, introVoiceoverSpeaking]);

  useEffect(() => {
    if (!isCrtTransition) return;
    const timer = setTimeout(() => {
      setIsCrtTransition(false);
      setShowIntroScreen(false);
      if (audioRef.current && data?.settings) {
        audioRef.current.volume = data.settings.musicVolume;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isCrtTransition, data?.settings]);

  // Graphic renderer for Station ID
  const renderStationIdGraphic = () => {
    if (!data?.settings) return null;
    const settings = data.settings;
    const graphicType = settings.stationIdGraphic || 'satellite';
    
    if (graphicType === 'satellite') {
      return (
        <div className="retro-satellite-graphic">
          <svg className="retro-satellite-svg" width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 50 C20 30, 40 10, 50 10 C60 10, 80 30, 80 50" stroke="#00f0ff" strokeWidth="3" fill="none" />
            <path d="M10 50 C10 25, 45 5, 50 5 C55 5, 90 25, 90 50" stroke="#3182ce" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
            <rect x="43" y="30" width="14" height="35" rx="2" fill="#00f0ff" stroke="#3182ce" strokeWidth="1.5" />
            <rect x="5" y="42" width="28" height="12" rx="1" fill="#3182ce" stroke="#00f0ff" strokeWidth="1" />
            <line x1="19" y1="42" x2="19" y2="54" stroke="#00f0ff" strokeWidth="1" />
            <line x1="10" y1="42" x2="10" y2="54" stroke="#00f0ff" strokeWidth="1" />
            <rect x="67" y="42" width="28" height="12" rx="1" fill="#3182ce" stroke="#00f0ff" strokeWidth="1" />
            <line x1="81" y1="42" x2="81" y2="54" stroke="#00f0ff" strokeWidth="1" />
            <line x1="90" y1="42" x2="90" y2="54" stroke="#00f0ff" strokeWidth="1" />
            <line x1="33" y1="48" x2="43" y2="48" stroke="#00f0ff" strokeWidth="1.5" />
            <line x1="57" y1="48" x2="67" y2="48" stroke="#00f0ff" strokeWidth="1.5" />
            <line x1="50" y1="65" x2="50" y2="82" stroke="#00f0ff" strokeWidth="2.5" />
            <circle cx="50" cy="82" r="4" fill="#e53e3e" />
            <path d="M42 82 A10 10 0 0 0 58 82" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <path d="M36 86 A18 18 0 0 0 64 86" stroke="#3182ce" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      );
    } else if (graphicType === 'radar') {
      return (
        <div className="retro-radar-scanner">
          <div className="retro-radar-grid" />
        </div>
      );
    } else if (graphicType === 'globe') {
      return (
        <div className="retro-globe-container">
          <div className="retro-globe-map" />
          <div className="retro-globe-latitudes" />
        </div>
      );
    } else if (graphicType === 'custom' && settings.stationIdCustomGraphicUrl) {
      return (
        <img 
          src={settings.stationIdCustomGraphicUrl} 
          alt={settings.stationIdName || 'Station Logo'} 
          style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
        />
      );
    }
    return null;
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#03082a' }}>
        <p style={{ fontSize: '1.5rem', color: '#00f0ff', fontFamily: 'var(--font-retro), monospace', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>
          CONECTANDO CON SATELITE METEOROLOGICO...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#03082a', color: '#ff3333' }}>
        <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-retro), monospace' }}>
          ERROR DE TRANSMISIÓN: {error || 'No se cargaron datos'}
        </p>
      </div>
    );
  }

  const settings = data.settings;
  
  const getScaledSize = (baseRem: number, section?: keyof TextSizeSettings, itemKey?: string) => {
    if (!settings?.textSizeSettings) return `${baseRem}rem`;
    const master = settings.textSizeSettings.masterSize ?? 1.0;
    let specific = 1.0;
    if (section && itemKey && settings.textSizeSettings[section]) {
      specific = (settings.textSizeSettings[section] as any)[itemKey] ?? 1.0;
    }
    return `${baseRem * master * specific}rem`;
  };

  const activeSlide = slides[activeSlideIndex] || { type: 'current' };
  const currentTempSymbol = settings.unitSystem === 'imperial' ? '°F' : '°C';
  const speedUnitStr = settings.unitSystem === 'imperial' ? 'mph' : 'km/h';
  const distanceUnitStr = settings.unitSystem === 'imperial' ? 'mi' : 'km';

  // Format moon phase (simulated based on day of month)
  const getMoonPhaseText = () => {
    const days = new Date().getDate();
    const phases = [
      'Luna Nueva', 'Creciente Cóncava', 'Cuarto Creciente', 'Creciente Convexa',
      'Luna Llena', 'Menguante Convexa', 'Cuarto Menguante', 'Menguante Cóncava'
    ];
    return phases[days % 8];
  };

  const getMoonPhaseGif = () => {
    const days = new Date().getDate();
    const index = days % 8;
    if (index === 0) return '/images/moon/Moon phases/New-Moon.gif';
    if (index >= 1 && index <= 3) return '/images/moon/Moon phases/First-Quarter.gif';
    if (index === 4) return '/images/moon/Moon phases/Full-Moon.gif';
    return '/images/moon/Moon phases/Last-Quarter.gif';
  };

  const formatBroadcastDate = (date: Date | null, timezoneOverride: string) => {
    if (!date) return '';
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    let tzLabel = timezoneOverride;
    if (!tzLabel) {
      try {
        const tzString = date.toLocaleTimeString('es-ES', { timeStyle: 'long' });
        const parts = tzString.split(' ');
        const lastPart = parts[parts.length - 1];
        if (lastPart && isNaN(Number(lastPart))) {
          tzLabel = lastPart;
        }
      } catch (e) {}
      
      if (!tzLabel) {
        const offset = date.getTimezoneOffset() / 60;
        if (offset === 4) tzLabel = 'CLT';
        else if (offset === 3) tzLabel = 'ART';
        else if (offset === 5) tzLabel = 'EST';
        else if (offset === 8) tzLabel = 'PST';
        else tzLabel = 'GMT' + (offset > 0 ? `-${offset}` : `+${Math.abs(offset)}`);
      }
    }
    
    return `${dayName}, ${monthName} ${day}, ${year}- ${hours}:${minutes}${ampm} ${tzLabel}`;
  };

  const formatCustomText = (text: string) => {
    if (!text) return '';
    if (!data?.mainCity) return text;
    
    // Extract weather details
    const city = data.mainCity.name || '';
    const country = data.mainCity.country || '';
    
    // Units
    const tempUnit = settings?.unitSystem === 'imperial' ? '°F' : '°C';
    const speedUnit = settings?.unitSystem === 'imperial' ? 'mph' : 'km/h';
    
    const tempVal = data.mainCity.current?.temp !== undefined && data.mainCity.current?.temp !== null ? Math.round(data.mainCity.current.temp) : '--';
    const conditionVal = data.mainCity.current?.weatherCode !== undefined && data.mainCity.current?.weatherCode !== null ? getWeatherDetails(data.mainCity.current.weatherCode).description : '';
    const humidityVal = data.mainCity.current?.humidity !== undefined && data.mainCity.current?.humidity !== null ? `${data.mainCity.current.humidity}%` : '';
    const windSpeedVal = data.mainCity.current?.windSpeed !== undefined && data.mainCity.current?.windSpeed !== null ? `${Math.round(data.mainCity.current.windSpeed)} ${speedUnit}` : '';
    const windDirVal = data.mainCity.current?.windDir !== undefined && data.mainCity.current?.windDir !== null ? getWindDirectionText(data.mainCity.current.windDir) : '';
    const pressureVal = data.mainCity.current?.pressure !== undefined && data.mainCity.current?.pressure !== null ? `${Math.round(data.mainCity.current.pressure)} hPa` : '';
    
    const uvVal = data.mainCity.current?.uvIndex ?? 0;
    const uvLevel = getUvLevelText(uvVal);
    const uvIndexVal = data.mainCity.current ? `${uvVal.toFixed(1)} (${uvLevel.text})` : '';
    
    const waveHeight = data.marine?.current?.waveHeight;
    const wavePeriod = data.marine?.current?.wavePeriod;
    const waveDir = data.marine?.current?.waveDir;
    let marineVal = 'N/A';
    if (waveHeight !== undefined && waveHeight !== null) {
      const waveDirStr = waveDir ? ` (${getWindDirectionText(waveDir)})` : '';
      marineVal = `${waveHeight.toFixed(1)} ${data.marine?.unit || 'm'} @ ${wavePeriod?.toFixed(0) || '0'}s${waveDirStr}`;
    }
    
    // Calculate Day Duration
    let dayDurationVal = 'N/A';
    const sunriseStr = data.mainCity.forecast?.[0]?.sunrise;
    const sunsetStr = data.mainCity.forecast?.[0]?.sunset;
    if (sunriseStr && sunsetStr) {
      const sunrise = new Date(sunriseStr).getTime();
      const sunset = new Date(sunsetStr).getTime();
      if (!isNaN(sunrise) && !isNaN(sunset) && sunset > sunrise) {
        const diffMs = sunset - sunrise;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        dayDurationVal = `${hrs}h ${mins}m`;
      }
    }
    
    // Time & Date format
    let dateVal = '';
    let timeVal = '';
    if (currentTime) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const dayName = days[currentTime.getDay()];
      const monthName = months[currentTime.getMonth()];
      const day = currentTime.getDate();
      const year = currentTime.getFullYear();
      
      let hours = currentTime.getHours();
      const minutes = String(currentTime.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      let tzLabel = settings?.broadcastIdTimezone || '';
      if (!tzLabel) {
        try {
          const tzString = currentTime.toLocaleTimeString('es-ES', { timeStyle: 'long' });
          const parts = tzString.split(' ');
          const lastPart = parts[parts.length - 1];
          if (lastPart && isNaN(Number(lastPart))) {
            tzLabel = lastPart;
          }
        } catch (e) {}
        if (!tzLabel) {
          const offset = currentTime.getTimezoneOffset() / 60;
          if (offset === 4) tzLabel = 'CLT';
          else if (offset === 3) tzLabel = 'ART';
          else if (offset === 5) tzLabel = 'EST';
          else if (offset === 8) tzLabel = 'PST';
          else tzLabel = 'GMT' + (offset > 0 ? `-${offset}` : `+${Math.abs(offset)}`);
        }
      }
      
      dateVal = `${dayName}, ${monthName} ${day}, ${year}`;
      timeVal = `${hours}:${minutes}${ampm} ${tzLabel}`;
    }
    
    return text
      .replace(/{ciudad}/g, city)
      .replace(/{pais}/g, country)
      .replace(/{clima_actual}/g, `${tempVal}°`)
      .replace(/{temp}/g, `${tempVal}°`)
      .replace(/{condicion}/g, conditionVal)
      .replace(/{humedad}/g, humidityVal)
      .replace(/{viento_velocidad}/g, windSpeedVal)
      .replace(/{viento_direccion}/g, windDirVal)
      .replace(/{presion}/g, pressureVal)
      .replace(/{indice_uv}/g, uvIndexVal)
      .replace(/{altura_olas}/g, marineVal)
      .replace(/{duracion_dia}/g, dayDurationVal)
      .replace(/{fecha}/g, dateVal)
      .replace(/{hora}/g, timeVal);
  };

  // Determine Day/Night theme mode
  const checkIsNight = () => {
    if (!data || !settings) return false;
    const mode = settings.themeMode || 'auto';
    if (mode === 'night') return true;
    if (mode === 'day') return false;

    // Mode is 'auto': first try the API's current isDay indicator (0 = night, 1 = day)
    if (data.mainCity?.current && typeof data.mainCity.current.isDay === 'number') {
      return data.mainCity.current.isDay === 0;
    }

    // Solar calculation based on sunrise and sunset
    try {
      const todayForecast = data.mainCity?.forecast?.[0];
      if (todayForecast?.sunrise && todayForecast?.sunset) {
        const now = new Date().getTime();
        const sunriseTime = new Date(todayForecast.sunrise).getTime();
        const sunsetTime = new Date(todayForecast.sunset).getTime();
        return now < sunriseTime || now > sunsetTime;
      }
    } catch (e) {
      console.error('Error calculating solar day/night state:', e);
    }

    // Fallback to local time checking (7:00 PM to 7:00 AM)
    const hour = new Date().getHours();
    return hour < 7 || hour >= 19;
  };

  const isNight = checkIsNight();

  // Resolve background photo URL
  const getBackgroundImage = () => {
    if (!data || !settings) return '';
    const mainCityWeather = data.mainCity;
    const weatherCode = mainCityWeather?.current?.weatherCode ?? 0;
    const cat = getWeatherCategory(weatherCode);
    const key = `${cat}_${isNight ? 'night' : 'day'}`;

    // Check custom URL overrides from settings
    const overrides = settings.customBackgrounds;
    if (overrides && overrides[key]) {
      return overrides[key];
    }
    return DEFAULT_WEATHER_BACKGROUNDS[key] || '';
  };

  const activeBgImage = getBackgroundImage();

  // Compile transition styles dynamically
  const themeTransitionDuration = settings.themeTransitionDuration ?? 2.0;
  const themeStyles: React.CSSProperties = {
    '--theme-transition-duration': `${themeTransitionDuration}s`,
    '--bg-retro': isNight
      ? 'radial-gradient(circle, #0e1b65 0%, #03082a 100%)'
      : 'radial-gradient(circle, #2563eb 0%, #1e3a8a 100%)',
    '--panel-bg': isNight
      ? 'rgba(6, 12, 70, 0.85)'
      : 'rgba(15, 23, 42, 0.75)',
    '--panel-border': isNight
      ? '2.5px solid #00f0ff'
      : '2.5px solid #ecc94b',
    '--panel-glow': isNight
      ? '0 0 15px rgba(0, 240, 255, 0.35)'
      : '0 0 15px rgba(236, 201, 75, 0.5)',
    '--text-cyan': isNight
      ? '#00ffff'
      : '#ecc94b',
  } as React.CSSProperties;

  // Get current slide label
  const getSlideLabel = () => {
    switch (activeSlide.type) {
      case 'current':
        return 'CONDICIONES ACTUALES';
      case 'localForecastText':
        return 'PRONÓSTICO LOCAL';
      case 'almanac':
        return 'ALMANAQUE ASTRONÓMICO';
      case 'radar':
        return 'IMAGEN DE RADAR LOCAL';
      case 'forecast':
        return 'PRONÓSTICO EXTENDIDO';
      case 'continentalRadar':
        return `RADAR CONTINENTAL - ${
          settings.continentalSelected === 'north_america' ? 'AMÉRICA DEL NORTE' :
          settings.continentalSelected === 'europe' ? 'EUROPA' :
          settings.continentalSelected === 'asia' ? 'ASIA' :
          settings.continentalSelected === 'africa' ? 'ÁFRICA' :
          settings.continentalSelected === 'oceania' ? 'OCEANÍA' : 'AMÉRICA DEL SUR'
        }`;
      case 'marineUv':
        return 'OLEAJE E ÍNDICE UV';
      default:
        return 'REPORTE CLIMÁTICO';
    }
  };

  const effects = settings?.effectsSettings || {};
  const crtScanlinesEnabled = effects.crtScanlinesEnabled ?? true;
  const crtFlickerEnabled = effects.crtFlickerEnabled ?? true;
  const scanlineSweepEnabled = effects.scanlineSweepEnabled ?? true;
  const textGlowEnabled = effects.textGlowEnabled ?? true;
  const panelGlowEnabled = effects.panelGlowEnabled ?? true;

  const containerClasses = [
    'crt-container',
    crtFlickerEnabled ? 'crt-flicker' : '',
    scanlineSweepEnabled ? 'scanline-sweep' : '',
    !crtScanlinesEnabled ? 'no-scanlines' : '',
    !textGlowEnabled ? 'no-text-glow' : '',
    !panelGlowEnabled ? 'no-panel-glow' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={themeStyles}>
      {/* Background audio element */}
      <audio ref={audioRef} loop />

      {/* Dynamic weather landscape background */}
      {settings.enableWeatherBackgrounds && activeBgImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${activeBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isNight ? 0.22 : 0.16,
            zIndex: 1,
            pointerEvents: 'none',
            transition: `opacity ${themeTransitionDuration}s ease-in-out, background-image ${themeTransitionDuration}s ease-in-out`,
          }}
        />
      )}

      {/* Header bar */}
      {activeSlide.type !== 'broadcastId' && (
        <header
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2.5rem',
            borderBottom: '3px solid var(--text-cyan, #00f0ff)',
            background: 'rgba(4, 8, 48, 0.9)',
            transition: 'border-color var(--theme-transition-duration, 3s) ease-in-out',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontSize: getScaledSize(2.5),
                fontWeight: 800,
                fontFamily: 'var(--font-retro), monospace',
                letterSpacing: '1.5px',
                textShadow: '0 0 10px rgba(255,255,255,0.2)',
              }}
            >
              {data.mainCity?.name.toUpperCase()}
            </h1>
            <span style={{ fontSize: getScaledSize(0.9), color: '#cbd5e0', fontWeight: 500, letterSpacing: '2px', marginTop: '0.2rem', fontFamily: 'var(--font-retro), monospace' }}>
              {data.mainCity?.country.toUpperCase()}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 className="title-glow-cyan" style={{ fontSize: getScaledSize(1.8, activeSlide.type as keyof TextSizeSettings, 'title'), fontFamily: 'var(--font-retro)', letterSpacing: '1px' }}>
              {getSlideLabel()}
            </h2>
            {/* Progress bar overlay indicator */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '0.5rem', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${slideProgress}%`,
                  height: '100%',
                  background: 'var(--text-cyan, #00f0ff)',
                  boxShadow: '0 0 8px var(--text-cyan)',
                  transition: 'width 0.1s linear, background-color var(--theme-transition-duration, 3s) ease-in-out',
                }}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main card viewport */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          padding: '2rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: (activeSlide.type !== 'broadcastId' && data.otherCities?.length) ? '3fr 1fr' : '1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
          {/* Slide container */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, justifyContent: 'center' }}>
            {settings.disableWeatherForFun ? (
              <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', textAlign: 'center', minHeight: '380px' }}>
                <style>{`
                  @keyframes satellite-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                  }
                  .satellite-failure-blink {
                    animation: satellite-blink 1.5s infinite ease-in-out;
                  }
                `}</style>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ff3333', fontFamily: 'var(--font-retro)', letterSpacing: '2px', textShadow: '0 0 15px rgba(255, 51, 51, 0.6)', marginBottom: '2rem', animation: 'satellite-blink 1s infinite' }}>
                  PRONÓSTICO NO DISPONIBLE
                </div>
                <div style={{ fontSize: '1.4rem', color: '#ffd54f', fontFamily: "var(--font-retro), monospace", maxWidth: '700px', lineHeight: '1.6', textTransform: 'uppercase', textShadow: '0 0 8px rgba(255, 213, 79, 0.4)' }}>
                  {activeFailureJoke}
                </div>
              </div>
            ) : (
              <>
                {activeSlide.type === 'current' && data.mainCity && (
                  <div className="retro-panel slide-active" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flex: 1, alignItems: 'center' }}>
                {/* Left side temperature card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px solid rgba(255,255,255,0.1)', paddingRight: '2rem' }}>
                  {(() => {
                    const details = getWeatherDetails(data.mainCity.current.weatherCode);
                    const WeatherIcon = details.Icon;
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <WeatherIcon className="w-32 h-32" style={{ color: 'var(--text-cyan)' }} />
                          <span style={{ fontSize: getScaledSize(7.0, 'current', 'temp'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: 'var(--text-yellow)', textShadow: '0 0 15px rgba(255, 255, 0, 0.4)', lineHeight: 1 }}>
                            {Math.round(data.mainCity.current.temp)}
                          </span>
                          <span style={{ fontSize: getScaledSize(3.0, 'current', 'temp'), fontWeight: 600, color: 'var(--text-yellow)', alignSelf: 'flex-start', marginTop: '1rem' }}>
                            {currentTempSymbol}
                          </span>
                        </div>
                        <h3 className="title-glow-cyan" style={{ fontSize: getScaledSize(2.5, 'current', 'title'), fontFamily: 'var(--font-retro)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem', textAlign: 'center' }}>
                          {details.description}
                        </h3>
                        <p style={{ fontSize: getScaledSize(1.2, 'current', 'details'), color: '#cbd5e0', marginTop: '0.8rem', fontWeight: 500 }}>
                          Sensación Térmica:{' '}
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>
                            {Math.round(data.mainCity.current.feelsLike)}
                            {currentTempSymbol}
                          </span>
                        </p>
                      </>
                    );
                  })()}
                </div>

                {/* Right Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem 2rem', background: 'rgba(2, 4, 30, 0.4)', borderRadius: '6px', borderLeft: '4px solid var(--text-cyan, #00f0ff)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: getScaledSize(1.5, 'current', 'details'), borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-cyan, #00f0ff)' }}>Humedad Relativa:</span>
                    <span style={{ fontWeight: 'bold' }}>{data.mainCity.current.humidity}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: getScaledSize(1.5, 'current', 'details'), borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-cyan, #00f0ff)' }}>Viento:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {getWindDirectionText(data.mainCity.current.windDir)} a {Math.round(data.mainCity.current.windSpeed)}{' '}
                      {speedUnitStr}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: getScaledSize(1.5, 'current', 'details'), borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-cyan, #00f0ff)' }}>Presión Barométrica:</span>
                    <span style={{ fontWeight: 'bold' }}>{Math.round(data.mainCity.current.pressure)} hPa</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: getScaledSize(1.5, 'current', 'details'), paddingBottom: '0.1rem' }}>
                    <span style={{ color: 'var(--text-cyan, #00f0ff)' }}>Visibilidad:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {data.mainCity.current.visibility > 999
                        ? `${(data.mainCity.current.visibility / 1000).toFixed(1)} ${distanceUnitStr}`
                        : `${data.mainCity.current.visibility} m`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSlide.type === 'localForecastText' && data.localForecastText && (
              <div className="retro-panel slide-active starjr-slide" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 className="title-glow-cyan" style={{ fontSize: getScaledSize(1.6, 'localForecastText', 'title'), borderBottom: '1.5px solid rgba(0, 240, 255, 0.2)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
                    HOY Y MAÑANA
                  </h3>
                  
                  {/* Two-Column Grid for Day / Night */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Left Column: Today (Day & Night) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid rgba(255, 255, 255, 0.15)', paddingRight: '1.5rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-yellow)', fontSize: getScaledSize(1.15, 'localForecastText', 'forecast'), fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.2rem' }}>PRONÓSTICO HOY</div>
                        <p style={{ fontSize: getScaledSize(1.3, 'localForecastText', 'forecast'), lineHeight: '1.4', color: '#fff', letterSpacing: '0.5px' }}>{data.localForecastText.today}</p>
                      </div>
                      {data.localForecastText.todayNight && (
                        <div>
                          <div style={{ color: '#ffd54f', fontSize: getScaledSize(1.15, 'localForecastText', 'forecast'), fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>🌙</span> HOY EN LA NOCHE
                          </div>
                          <p style={{ fontSize: getScaledSize(1.3, 'localForecastText', 'forecast'), lineHeight: '1.4', color: '#cbd5e0', letterSpacing: '0.5px' }}>{data.localForecastText.todayNight}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Tomorrow (Day & Night) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-cyan)', fontSize: getScaledSize(1.15, 'localForecastText', 'forecast'), fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.2rem' }}>MAÑANA</div>
                        <p style={{ fontSize: getScaledSize(1.3, 'localForecastText', 'forecast'), lineHeight: '1.4', color: '#fff', letterSpacing: '0.5px' }}>{data.localForecastText.tomorrow}</p>
                      </div>
                      {data.localForecastText.tomorrowNight && (
                        <div>
                          <div style={{ color: '#818cf8', fontSize: getScaledSize(1.15, 'localForecastText', 'forecast'), fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>🌙</span> MAÑANA EN LA NOCHE
                          </div>
                          <p style={{ fontSize: getScaledSize(1.3, 'localForecastText', 'forecast'), lineHeight: '1.4', color: '#cbd5e0', letterSpacing: '0.5px' }}>{data.localForecastText.tomorrowNight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Extended Trend Panel */}
                <div style={{ background: 'rgba(2, 4, 30, 0.3)', borderTop: '2px solid var(--text-cyan)', padding: '0.8rem 1.2rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ color: '#cbd5e0', fontSize: getScaledSize(0.95, 'localForecastText', 'extended'), fontWeight: 'bold', letterSpacing: '1px' }}>TENDENCIA EXTENDIDA</div>
                  <p style={{ fontSize: getScaledSize(1.25, 'localForecastText', 'extended'), color: '#cbd5e0', fontStyle: 'italic', lineHeight: '1.3' }}>{data.localForecastText.extended}</p>
                  {data.localForecastText.extendedNight && (
                    <p style={{ fontSize: getScaledSize(1.25, 'localForecastText', 'extended'), color: '#a5b4fc', fontStyle: 'italic', lineHeight: '1.3' }}>{data.localForecastText.extendedNight}</p>
                  )}
                </div>
              </div>
            )}

            {activeSlide.type === 'almanac' && data.mainCity && (() => {
              const sunriseTime = data.mainCity.forecast?.[0]?.sunrise ? new Date(data.mainCity.forecast[0].sunrise).getTime() : 0;
              const sunsetTime = data.mainCity.forecast?.[0]?.sunset ? new Date(data.mainCity.forecast[0].sunset).getTime() : 0;
              let dayLengthStr = 'N/A';
              if (sunriseTime && sunsetTime) {
                const diffMs = sunsetTime - sunriseTime;
                const diffHrs = Math.floor(diffMs / 3600000);
                const diffMins = Math.floor((diffMs % 3600000) / 60000);
                dayLengthStr = `${diffHrs} horas, ${diffMins} minutos`;
              }

              return (
                <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, padding: '2rem' }}>
                  <h3 className="title-glow-cyan" style={{ fontSize: getScaledSize(1.8, 'almanac', 'title'), borderBottom: '2px solid rgba(0,240,255,0.3)', paddingBottom: '0.6rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ALMANAQUE ASTRONÓMICO
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
                    {/* Left half: Sun Cycles */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', borderRadius: '8px', border: '1.5px solid rgba(0, 240, 255, 0.15)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: '#f57f17', padding: '0.6rem', borderRadius: '50%', color: '#fff', fontSize: '2rem', boxShadow: '0 0 10px rgba(245,127,23,0.4)' }}>🌅</div>
                        <div>
                          <div style={{ fontSize: getScaledSize(0.9, 'almanac', 'details'), color: 'var(--text-cyan)', letterSpacing: '1px' }}>SALIDA DEL SOL (AMANECER)</div>
                          <div style={{ fontSize: getScaledSize(2.2, 'almanac', 'details'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: '#fff', textShadow: '0 0 8px rgba(255,255,255,0.2)' }}>
                            {data.mainCity.forecast?.[0]?.sunrise
                              ? new Date(data.mainCity.forecast[0].sunrise).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                              : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: '#5e35b1', padding: '0.6rem', borderRadius: '50%', color: '#fff', fontSize: '2rem', boxShadow: '0 0 10px rgba(94,53,177,0.4)' }}>🌇</div>
                        <div>
                          <div style={{ fontSize: getScaledSize(0.9, 'almanac', 'details'), color: 'var(--text-cyan)', letterSpacing: '1px' }}>PUESTA DEL SOL (ATARDECER)</div>
                          <div style={{ fontSize: getScaledSize(2.2, 'almanac', 'details'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: '#fff', textShadow: '0 0 8px rgba(255,255,255,0.2)' }}>
                            {data.mainCity.forecast?.[0]?.sunset
                              ? new Date(data.mainCity.forecast[0].sunset).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right half: Day length and Lunar Cycle */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', borderRadius: '8px', border: '1.5px solid rgba(0, 240, 255, 0.15)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: '#00796b', padding: '0.6rem', borderRadius: '50%', color: '#fff', fontSize: '2rem', boxShadow: '0 0 10px rgba(0,121,107,0.4)' }}>⏱️</div>
                        <div>
                          <div style={{ fontSize: getScaledSize(0.9, 'almanac', 'details'), color: 'var(--text-cyan)', letterSpacing: '1px' }}>DURACIÓN TOTAL DEL DÍA</div>
                          <div style={{ fontSize: getScaledSize(1.8, 'almanac', 'details'), fontWeight: 'bold', color: 'var(--text-yellow)', fontFamily: 'var(--font-digital)' }}>
                            {dayLengthStr}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(13,71,161,0.2)', padding: '0.2rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.3)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(13,71,161,0.4)' }}>
                          <img src={getMoonPhaseGif()} alt="Fase Lunar" style={{ width: '48px', height: '48px', imageRendering: 'pixelated', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: getScaledSize(0.9, 'almanac', 'details'), color: 'var(--text-cyan)', letterSpacing: '1px' }}>FASE LUNAR ACTUAL</div>
                          <div style={{ fontSize: getScaledSize(1.8, 'almanac', 'details'), fontWeight: 'bold', color: 'var(--text-yellow)', textTransform: 'uppercase', textShadow: '0 0 10px rgba(255,255,0,0.2)' }}>
                            {getMoonPhaseText()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeSlide.type === 'radar' && data.mainCity && (
              <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: getScaledSize(1.1, 'radar', 'title'), color: '#fff', fontWeight: 600 }}>
                    Capa:{' '}
                    <span style={{ color: 'var(--text-yellow)' }}>
                      {settings.activeRadarType === 'wind'
                        ? 'Viento Regional'
                        : settings.activeRadarType === 'temperature'
                        ? 'Temperatura Regional'
                        : 'Precipitación y Lluvia'}
                    </span>
                  </span>
                  <span style={{ fontSize: getScaledSize(0.85, 'radar', 'title'), color: '#cbd5e0', fontStyle: 'italic' }}>
                    Centro: {data.mainCity.name}
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <RadarMap
                    latitude={settings.mainCity.latitude}
                    longitude={settings.mainCity.longitude}
                    radarPoints={data.radarPoints}
                    radarType={settings.activeRadarType || 'precipitation'}
                    unitSystem={settings.unitSystem}
                    radarColorScheme={settings.radarColorScheme}
                    cardinalSizeMultiplier={settings.textSizeSettings?.radar?.cardinals ?? 1.0}
                  />
                </div>
              </div>
            )}

            {activeSlide.type === 'forecast' && data.mainCity && (
              <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', flex: 1, alignItems: 'stretch' }}>
                  {data.mainCity.forecast?.slice(0, 5).map((day, idx) => {
                    const dayDetails = getWeatherDetails(day.weatherCode);
                    const DayIcon = dayDetails.Icon;
                    const dateObj = new Date(day.date + 'T12:00:00');
                    const weekday = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                    const dayLabel = idx === 0 ? 'HOY' : weekday;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(2, 4, 30, 0.4)',
                          borderRadius: '6px',
                          border: '1.5px solid rgba(0, 240, 255, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.2rem 0.5rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: getScaledSize(1.2, 'forecast', 'dayLabel'), fontWeight: 'bold', color: idx === 0 ? 'var(--text-yellow)' : '#fff', letterSpacing: '1px' }}>
                          {dayLabel}
                        </div>
                        <div style={{ margin: '1rem 0' }}>
                          <DayIcon className="w-16 h-16" style={{ color: 'var(--text-cyan)', filter: 'drop-shadow(0 0 5px rgba(0,240,255,0.4))' }} />
                        </div>
                        <div style={{ fontSize: getScaledSize(0.85, 'forecast', 'description'), color: '#cbd5e0', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', padding: '0 0.2rem' }}>
                          {dayDetails.description}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.8rem' }}>
                          <div style={{ fontSize: getScaledSize(1.6, 'forecast', 'tempMax'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: 'var(--text-yellow)' }}>
                            {Math.round(day.tempMax)}°
                          </div>
                          <div style={{ fontSize: getScaledSize(1.2, 'forecast', 'tempMin'), fontFamily: 'var(--font-digital)', color: '#cbd5e0' }}>
                            {Math.round(day.tempMin)}°
                          </div>
                        </div>
                        {day.pop > 15 && (
                          <div style={{ fontSize: getScaledSize(0.8, 'forecast', 'precipitation'), color: '#39ff14', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            ☔ {day.pop}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSlide.type === 'continentalRadar' && data.continentalWeather && (
              <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: getScaledSize(1.1, 'continentalRadar', 'title'), color: '#fff', fontWeight: 600 }}>
                    Radar de Continente:{' '}
                    <span style={{ color: 'var(--text-yellow)' }}>
                      {settings.continentalSelected === 'south_america' ? 'América del Sur' :
                       settings.continentalSelected === 'north_america' ? 'América del Norte' :
                       settings.continentalSelected === 'europe' ? 'Europa' :
                       settings.continentalSelected === 'asia' ? 'Asia' :
                       settings.continentalSelected === 'africa' ? 'África' :
                       settings.continentalSelected === 'oceania' ? 'Oceanía' : 'América del Sur'}
                    </span>
                  </span>
                  <span style={{ fontSize: getScaledSize(0.85, 'continentalRadar', 'title'), color: '#cbd5e0', fontStyle: 'italic' }}>
                    Escaneo Continental en 2D (Desplazamiento Suave)
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ContinentalRadarMap
                    continentKey={settings.continentalSelected || 'south_america'}
                    weatherData={data.continentalWeather || []}
                    slideProgress={slideProgress}
                    scrollSpeed={settings.continentalSpeed !== undefined ? settings.continentalSpeed : 1.0}
                    loopMode={settings.continentalLoop !== undefined ? settings.continentalLoop : false}
                    zoomLevel={settings.continentalZoom !== undefined ? settings.continentalZoom : 4}
                    radarColorScheme={settings.radarColorScheme}
                    capitalSizeMultiplier={settings.textSizeSettings?.continentalRadar?.capital ?? 1.0}
                    temperatureSizeMultiplier={settings.textSizeSettings?.continentalRadar?.temperature ?? 1.0}
                    precipitationSizeMultiplier={settings.textSizeSettings?.continentalRadar?.precipitation ?? 1.0}
                  />
                </div>
              </div>
            )}

            {activeSlide.type === 'marineUv' && data.mainCity && (() => {
              const uvVal = data.mainCity.current.uvIndex ?? 0;
              const uvLevel = getUvLevelText(uvVal);
              const pressureVal = data.mainCity.current.pressure ?? 1013;
              const pressureState = pressureVal > 1020 ? 'ALTA' : pressureVal < 1008 ? 'BAJA' : 'NORMAL';
              const waveHeight = data.marine?.current?.waveHeight;
              const wavePeriod = data.marine?.current?.wavePeriod;
              const waveDir = data.marine?.current?.waveDir;
              
              const uvPoints = data.mainCity.hourly?.uvIndex || Array(24).fill(0);
              const wavePoints = data.marine?.hourly?.waveHeight || Array(24).fill(0);
              const timeLabels = data.mainCity.hourly?.time || Array(24).fill('');

              const uvMax = Math.max(10, ...uvPoints);
              const waveMax = Math.max(3, ...wavePoints);

              return (
                <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: '1.5rem', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,240,255,0.3)', paddingBottom: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: getScaledSize(1.4, 'marineUv', 'title'), color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      MONITOR DE OLEAJE E ÍNDICE UV
                    </span>
                    <span style={{ fontSize: getScaledSize(0.9, 'marineUv', 'title'), color: 'var(--text-yellow)', fontFamily: 'var(--font-retro), monospace' }}>
                      REPORTES EN VIVO
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', flexShrink: 0 }}>
                    {/* UV Index Box */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: '1.5px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'marineUv', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>ÍNDICE UV ACTUAL</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: getScaledSize(2.0, 'marineUv', 'details'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: uvLevel.color }}>
                          {uvVal.toFixed(1)}
                        </span>
                        <span style={{ fontSize: getScaledSize(0.9, 'marineUv', 'details'), fontWeight: 'bold', color: uvLevel.color }}>
                          {uvLevel.text}
                        </span>
                      </div>
                      <div style={{ fontSize: getScaledSize(0.65, 'marineUv', 'details'), color: '#cbd5e0', lineHeight: '1.2' }}>{uvLevel.advice}</div>
                    </div>

                    {/* Waves Box */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: '1.5px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'marineUv', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>CONDICIONES DE OLEAJE</div>
                      {waveHeight !== undefined && waveHeight !== null ? (
                        <>
                          <div style={{ fontSize: getScaledSize(1.5, 'marineUv', 'details'), fontWeight: 'bold', color: 'var(--text-yellow)', fontFamily: 'var(--font-digital)' }}>
                            {waveHeight.toFixed(1)} {data.marine?.unit || 'm'} @ {wavePeriod?.toFixed(0) || '0'}s
                          </div>
                          <div style={{ fontSize: getScaledSize(0.75, 'marineUv', 'details'), color: '#fff', textTransform: 'uppercase' }}>
                            Dirección: {waveDir ? `${getWindDirectionText(waveDir)} (${waveDir}°)` : 'N/A'}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: getScaledSize(0.9, 'marineUv', 'details'), color: '#ecc94b', fontStyle: 'italic' }}>
                          Sin datos marinos (Interior)
                        </div>
                      )}
                    </div>

                    {/* Barometric Pressure Box */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: '1.5px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'marineUv', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>PRESIÓN BAROMÉTRICA</div>
                      <div style={{ fontSize: getScaledSize(2.0, 'marineUv', 'details'), fontWeight: 'bold', fontFamily: 'var(--font-digital)', color: '#fff' }}>
                        {pressureVal.toFixed(0)} <span style={{ fontSize: getScaledSize(1.1, 'marineUv', 'details') }}>hPa</span>
                      </div>
                      <div style={{ fontSize: getScaledSize(0.7, 'marineUv', 'details'), color: '#a0aec0', textTransform: 'uppercase' }}>
                        TENDENCIA: {pressureState} (ESTABLE)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    <RetroChart
                      title="PRONÓSTICO 24H: ÍNDICE UV"
                      dataPoints={uvPoints}
                      timeLabels={timeLabels}
                      color="#ecc94b"
                      yMax={uvMax}
                      unit=""
                    />
                    <RetroChart
                      title={`PRONÓSTICO 24H: ALTURA OLAS (${data.marine?.unit || 'm'})`}
                      dataPoints={wavePoints}
                      timeLabels={timeLabels}
                      color="#00f0ff"
                      yMax={waveMax}
                      unit={data.marine?.unit || 'm'}
                    />
                  </div>

                  {/* Recomendaciones / Advertencia de Salud en la parte inferior */}
                  {(() => {
                    const warning = getMarineUvWarning(uvVal, waveHeight, data.marine?.unit || 'm');
                    return (
                      <div style={{ 
                        background: 'rgba(2, 4, 30, 0.4)', 
                        border: `1.5px solid ${warning.color}`, 
                        borderRadius: '6px', 
                        padding: '0.8rem 1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        flexShrink: 0,
                        boxShadow: `0 0 10px rgba(${warning.color === '#00ff66' ? '0, 255, 102' : warning.color === '#ffff00' ? '255, 255, 0' : warning.color === '#ff9900' ? '255, 153, 0' : warning.color === '#ff3300' ? '255, 51, 0' : '204, 0, 255'}, 0.2)`
                      }}>
                        <div style={{ 
                          fontSize: '1.8rem', 
                          background: `rgba(${warning.color === '#00ff66' ? '0, 255, 102' : warning.color === '#ffff00' ? '255, 255, 0' : warning.color === '#ff9900' ? '255, 153, 0' : warning.color === '#ff3300' ? '255, 51, 0' : '204, 0, 255'}, 0.15)`,
                          padding: '0.4rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}>
                          ⚠️
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: getScaledSize(0.85, 'marineUv', 'details'), fontWeight: 'bold', color: warning.color, letterSpacing: '0.5px' }}>
                            ADVERTENCIA Y RECOMENDACIÓN DE SALUD ({warning.text})
                          </span>
                          <span style={{ fontSize: getScaledSize(0.7, 'marineUv', 'details'), color: '#fff', lineHeight: '1.3' }}>
                            {warning.advice}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {activeSlide.type === 'airQuality' && data.airQuality && (() => {
              const cur = data.airQuality.current;
              const pm25Val = cur.pm2_5 ?? 0;
              const pm10Val = cur.pm10 ?? 0;
              const o3Val = cur.ozone ?? 0;
              const no2Val = cur.no2 ?? 0;
              const coVal = cur.co ?? 0;
              
              // Clasificación EPA aproximada
              let levelVal = 0;
              if (pm25Val > 250.4 || pm10Val > 424) levelVal = 5;
              else if (pm25Val > 150.4 || pm10Val > 354) levelVal = 4;
              else if (pm25Val > 55.4 || pm10Val > 254) levelVal = 3;
              else if (pm25Val > 35.4 || pm10Val > 154) levelVal = 2;
              else if (pm25Val > 12.0 || pm10Val > 54) levelVal = 1;

              const aqStates = [
                { text: 'BUENA', color: '#4caf50', desc: 'Satisfecho, sin riesgo.', advice: 'Calidad de aire excelente. Disfruta tus actividades al aire libre.' },
                { text: 'MODERADA', color: '#ffeb3b', desc: 'Riesgo leve para personas muy sensibles.', advice: 'Personas extremadamente sensibles deben considerar reducir esfuerzos.' },
                { text: 'INSALUBRE (G. SENSIBLES)', color: '#ff9800', desc: 'Riesgo para niños, ancianos o asmáticos.', advice: 'Evitar esfuerzos prolongados al aire libre si tienes asma o problemas cardíacos.' },
                { text: 'INSALUBRE / DAÑINA', color: '#f44336', desc: 'Efectos adversos leves en toda la población.', advice: 'Toda persona debe reducir el esfuerzo físico prolongado o intenso al aire libre.' },
                { text: 'MUY INSALUBRE / DAÑINA', color: '#9c27b0', desc: 'Alerta de salud: riesgo de efectos serios.', advice: 'Evitar toda actividad física vigorosa en el exterior. Grupos sensibles en interiores.' },
                { text: 'PELIGROSA', color: '#e53e3e', desc: 'Condición de emergencia grave para la salud.', advice: '¡EVITAR TODO ESFUERZO AL AIRE LIBRE! Permanezca en interiores cerrados.' }
              ];
              
              const aqState = aqStates[levelVal];

              const pm25Points = data.airQuality.hourly?.pm2_5 || Array(24).fill(0);
              const pm10Points = data.airQuality.hourly?.pm10 || Array(24).fill(0);
              const timeLabels = data.airQuality.hourly?.time || Array(24).fill('');

              const pm25Max = Math.max(25, ...pm25Points);
              const pm10Max = Math.max(60, ...pm10Points);

              return (
                <div className="retro-panel slide-active" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: '1.5rem', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,240,255,0.3)', paddingBottom: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: getScaledSize(1.4, 'airQuality', 'title'), color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      MONITOR DE CALIDAD DEL AIRE
                    </span>
                    <span style={{ fontSize: getScaledSize(0.9, 'airQuality', 'title'), color: 'var(--text-yellow)', fontFamily: 'var(--font-retro), monospace' }}>
                      CAMS GLOBAL MODEL
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', flexShrink: 0 }}>
                    {/* Alerta de Salud EPA */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: `1.5px solid ${aqState.color}`, borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '95px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'airQuality', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>ÍNDICE EPA ACTUAL</div>
                      <div style={{ fontSize: getScaledSize(1.2, 'airQuality', 'details'), fontWeight: 'bold', color: aqState.color, fontFamily: 'var(--font-retro), monospace' }}>
                        {aqState.text}
                      </div>
                      <div style={{ fontSize: getScaledSize(0.65, 'airQuality', 'details'), color: '#cbd5e0', lineHeight: '1.2' }}>{aqState.advice}</div>
                    </div>

                    {/* Particulas Finas */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: '1.5px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '95px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'airQuality', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>PARTÍCULAS EN EL AIRE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontSize: getScaledSize(1.2, 'airQuality', 'details'), fontWeight: 'bold', color: 'var(--text-yellow)', fontFamily: 'var(--font-digital)' }}>
                          PM2.5: {pm25Val.toFixed(1)} <span style={{ fontSize: getScaledSize(0.8, 'airQuality', 'details') }}>µg/m³</span>
                        </div>
                        <div style={{ fontSize: getScaledSize(1.2, 'airQuality', 'details'), fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-digital)' }}>
                          PM10: {pm10Val.toFixed(1)} <span style={{ fontSize: getScaledSize(0.8, 'airQuality', 'details') }}>µg/m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Reporte de Gases */}
                    <div style={{ background: 'rgba(2, 4, 30, 0.4)', border: '1.5px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '95px' }}>
                      <div style={{ fontSize: getScaledSize(0.75, 'airQuality', 'details'), color: 'var(--text-cyan)', letterSpacing: '0.5px' }}>CONCENTRACIÓN DE GASES</div>
                      <div style={{ fontSize: getScaledSize(0.7, 'airQuality', 'details'), color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <div>O3 (Ozono): {o3Val.toFixed(1)} µg/m³</div>
                        <div>NO2 (Dióxido Nitrógeno): {no2Val.toFixed(1)} µg/m³</div>
                        <div>CO (Monóxido Carbono): {coVal.toFixed(0)} µg/m³</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    <RetroChart
                      title="PRONÓSTICO 24H: PARTÍCULAS PM2.5 (µg/m³)"
                      dataPoints={pm25Points}
                      timeLabels={timeLabels}
                      color="#f6ad55"
                      yMax={pm25Max}
                      unit=""
                    />
                    <RetroChart
                      title="PRONÓSTICO 24H: PARTÍCULAS PM10 (µg/m³)"
                      dataPoints={pm10Points}
                      timeLabels={timeLabels}
                      color="#ecc94b"
                      yMax={pm10Max}
                      unit=""
                    />
                  </div>

                  {/* Recomendaciones / Advertencia de Salud en la parte inferior */}
                  <div style={{ 
                    background: 'rgba(2, 4, 30, 0.4)', 
                    border: `1.5px solid ${aqState.color}`, 
                    borderRadius: '6px', 
                    padding: '0.8rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    flexShrink: 0,
                    boxShadow: `0 0 10px rgba(${aqState.color === '#4caf50' ? '76, 175, 80' : aqState.color === '#ffeb3b' ? '255, 235, 59' : aqState.color === '#ff9800' ? '255, 152, 0' : aqState.color === '#f44336' ? '244, 67, 54' : aqState.color === '#9c27b0' ? '156, 39, 176' : '229, 62, 98'}, 0.2)`
                  }}>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      background: `rgba(${aqState.color === '#4caf50' ? '76, 175, 80' : aqState.color === '#ffeb3b' ? '255, 235, 59' : aqState.color === '#ff9800' ? '255, 152, 0' : aqState.color === '#f44336' ? '244, 67, 54' : aqState.color === '#9c27b0' ? '156, 39, 176' : '229, 62, 98'}, 0.15)`,
                      padding: '0.4rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1
                    }}>
                      ⚠️
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: getScaledSize(0.85, 'airQuality', 'details'), fontWeight: 'bold', color: aqState.color, letterSpacing: '0.5px' }}>
                        ADVERTENCIA Y RECOMENDACIÓN DE SALUD ({aqState.text})
                      </span>
                      <span style={{ fontSize: getScaledSize(0.7, 'airQuality', 'details'), color: '#fff', lineHeight: '1.3' }}>
                        {getAirQualityHealthWarning(levelVal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
              </>
            )}
          </div>

          {/* Right Side Column (Widget Regional Cities list) */}
          {activeSlide.type !== 'broadcastId' && data.otherCities && data.otherCities.length > 0 && (() => {
            const mode = data.settings?.sidebarMediaMode || 'none';
            if (mode === 'tv' || mode === 'images') {
              const itemHeight = 54; // approximate height including gap
              const loopHeight = data.otherCities.length * itemHeight;
              const speed = data.settings?.cityScrollSpeed || 30;
              const scrollDuration = Math.max(5, loopHeight / speed);

              return (
                <div className="retro-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%', overflow: 'hidden', padding: '0.8rem' }}>
                  {/* Upper multimedia section (50% split) */}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <SidebarMedia settings={data.settings} onTvActive={setTvActive} voiceoverSpeaking={voiceoverSpeaking || introVoiceoverSpeaking} resolvedTvStreamUrl={data?.resolvedTvStreamUrl} />
                  </div>

                  {/* Regional Report Title */}
                  <h3 className="title-glow-cyan" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--text-cyan)', paddingBottom: '0.3rem', letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase', margin: '0.2rem 0 0 0', flexShrink: 0 }}>
                    REPORTE REGIONAL
                  </h3>

                  {/* Lower compact auto-scrolling city list (50% split) */}
                  <div className="cities-scroll-container" style={{ flex: 1, minHeight: 0 }}>
                    <div
                      className="cities-scroll-content"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        ['--scroll-duration' as any]: `${scrollDuration}s`
                      }}
                    >
                      {/* Render cities twice to make it seamless infinite loop */}
                      {[...data.otherCities, ...data.otherCities].map((city, idx) => {
                        const isFailure = data.settings?.disableWeatherForFun;
                        const tempVal = isFailure ? '--°' : `${Math.round(city.temp)}°`;
                        const cityDetails = getWeatherDetails(isFailure ? null : city.weatherCode);
                        const CityIcon = cityDetails.Icon;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', background: 'rgba(2, 4, 30, 0.4)', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.15)', height: '46px', flexShrink: 0 }}>
                            <div style={{ minWidth: 0, flex: 1, paddingRight: '0.4rem' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                                {city.name.toUpperCase()}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#a0aec0', marginTop: '0.1rem', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {isFailure ? 'DATOS CAÍDOS' : cityDetails.description}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CityIcon className="w-8 h-8" style={{ color: 'var(--text-cyan)' }} />
                              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-yellow)', fontFamily: 'var(--font-digital)' }}>
                                {tempVal}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Default 'none' mode layout: Full height regional cities widget (no media, with auto-scroll)
            const itemHeight = 54; // approximate height including gap
            const loopHeight = data.otherCities.length * itemHeight;
            const speed = data.settings?.cityScrollSpeed || 30;
            const scrollDuration = Math.max(5, loopHeight / speed);

            return (
              <div className="retro-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%', overflow: 'hidden', padding: '0.8rem' }}>
                <h3 className="title-glow-cyan" style={{ fontSize: '1.1rem', borderBottom: '2px solid var(--text-cyan)', paddingBottom: '0.4rem', letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase', margin: '0.2rem 0 0 0', flexShrink: 0 }}>
                  REPORTE REGIONAL
                </h3>
                <div className="cities-scroll-container" style={{ flex: 1, minHeight: 0 }}>
                  <div
                    className="cities-scroll-content"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      ['--scroll-duration' as any]: `${scrollDuration}s`
                    }}
                  >
                    {[...data.otherCities, ...data.otherCities].map((city, idx) => {
                      const isFailure = data.settings?.disableWeatherForFun;
                      const tempVal = isFailure ? '--°' : `${Math.round(city.temp)}°`;
                      const cityDetails = getWeatherDetails(isFailure ? null : city.weatherCode);
                      const CityIcon = cityDetails.Icon;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', background: 'rgba(2, 4, 30, 0.4)', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.15)', height: '46px', flexShrink: 0 }}>
                          <div style={{ minWidth: 0, flex: 1, paddingRight: '0.4rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                              {city.name.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '0.1rem', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isFailure ? 'DATOS CAÍDOS' : cityDetails.description}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CityIcon className="w-8 h-8" style={{ color: 'var(--text-cyan)' }} />
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-yellow)', fontFamily: 'var(--font-digital)' }}>
                              {tempVal}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Crawl text marquee ticker bottom bar */}
      <footer className="marquee-bar">
        {activeSlide.type !== 'broadcastId' && mounted && currentTime && (() => {
          const showDate = settings.clockShowDate !== false;
          return (
            <div 
              className="marquee-time-box"
              style={showDate ? {
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0.2rem 1rem',
                lineHeight: '1.2'
              } : undefined}
            >
              {showDate && (
                <div style={{
                  fontSize: '0.72rem',
                  fontFamily: "'Star3000', monospace",
                  color: '#cbd5e0',
                  textTransform: 'uppercase',
                  marginBottom: '0.1rem',
                  letterSpacing: '1px'
                }}>
                  {formattedDateStr}
                </div>
              )}
              <div style={{ fontSize: showDate ? '1.15rem' : '1.3rem', letterSpacing: '0.5px' }}>
                {formattedTimeStr}
              </div>
            </div>
          );
        })()}
        <div className="marquee-container">
          <div 
            className={`marquee-content ${settings.disableWeatherForFun ? 'satellite-failure-blink' : ''}`}
            style={{ animationDuration: `${marqueeDuration}s` }}
          >
            {compiledMarqueeText.toUpperCase()}
          </div>
        </div>
      </footer>

      {/* Second ticker bar right below the main marquee */}
      <div className="sub-marquee-bar">
        {activeSlide.type !== 'broadcastId' && (
          <div className="sub-marquee-label-box">
            REDES Y NOTICIAS
          </div>
        )}
        <div className="sub-marquee-container">
          <div className="sub-marquee-content" style={{ animationDuration: `${subMarqueeDuration}s` }}>
            {compiledSubMarqueeText.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Floater overlay bypass cover for audio context trigger */}
      {!unlocked && (settings.musicEnabled || settings.voiceoverEnabled || settings.stationIdEnabled) && (
        <div
          onClick={handleUnlock}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div className="retro-panel" style={{ padding: '3rem', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '1.8rem', alignItems: 'center', boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)', border: '2px solid var(--text-cyan)' }}>
            <h3 className="title-glow-cyan" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-retro)', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
              {settings.stationIdEnabled ? 'SINTONIZADOR METEOROLÓGICO' : 'REPORTE CLIMÁTICO ACTIVO'}
            </h3>
            
            {/* Retro color bars or test pattern representation */}
            <div style={{ display: 'flex', width: '100%', height: '40px', border: '2px solid rgba(255,255,255,0.2)', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
              <div style={{ flex: 1, backgroundColor: '#ffff00' }} />
              <div style={{ flex: 1, backgroundColor: '#00ffff' }} />
              <div style={{ flex: 1, backgroundColor: '#00ff00' }} />
              <div style={{ flex: 1, backgroundColor: '#ff00ff' }} />
              <div style={{ flex: 1, backgroundColor: '#ff0000' }} />
              <div style={{ flex: 1, backgroundColor: '#0000ff' }} />
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '1.1rem', lineHeight: '1.6', margin: 0, fontFamily: 'var(--font-retro), monospace', letterSpacing: '1px' }}>
              {settings.stationIdEnabled 
                ? 'SEÑAL DE ESTACIÓN METEOROLÓGICA DETECTADA. PRESIONE ABAJO PARA INICIAR LA SINTONIZACIÓN Y ESTABLECER LA CONEXIÓN DE AUDIO.'
                : 'EL SATÉLITE METEOROLÓGICO ESTÁ LISTO PARA TRANSMITIR. HAGA CLIC PARA INICIAR LA SEÑAL Y ACTIVAR INFORMES HABLADOS.'}
            </p>
            <button
              onClick={handleUnlock}
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '1.3rem', padding: '0.9rem 3rem', textTransform: 'uppercase', fontFamily: 'var(--font-retro)', letterSpacing: '2px', boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)', cursor: 'pointer' }}
            >
              {settings.stationIdEnabled ? 'Sintonizar Canal 📡' : 'Iniciar Transmisión 📺'}
            </button>
          </div>
        </div>
      )}

      {/* Station ID Presentation Overlay */}
      {showIntroScreen && (
        <div className="station-id-container">
          <div className="station-id-panel">
            <h2 className="station-id-title">{settings.stationIdName || 'WEA-THER TV'}</h2>
            <div className="station-id-provider">{settings.stationIdProvider || 'TRANSMISIÓN METEOROLÓGICA'}</div>
            
            <div className="station-id-graphics">
              {renderStationIdGraphic()}
            </div>
            
            <div className="station-id-buffering-box">
              <div className="station-id-buffering-label">
                {introProgress < 30 ? 'ESTABLECIENDO CONEXIÓN...' :
                 introProgress < 65 ? 'RECIBIENDO DATOS CLIMÁTICOS...' :
                 introProgress < 90 ? 'PRE-CARGANDO GRÁFICOS Y RADAR...' : 'SEÑAL DE AUDIO SINTONIZADA'}
              </div>
              <div className="station-id-progress-bg">
                <div className="station-id-progress-bar" style={{ width: `${introProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WeatherSTAR 4000 (2005) Station ID Slide Overlay */}
      {unlocked && !showIntroScreen && activeSlide.type === 'broadcastId' && !settings.disableWeatherForFun && (
        <div className="ws4000-id-slide-bg" style={{ paddingBottom: '95px' }}>

          <div className="ws4000-id-inner-box" style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', width: '100%', flex: 1, minHeight: 0 }}>
              {/* Left Column: Station Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, justifyContent: 'flex-start' }}>
                <div className="ws4000-id-line-location">
                  {settings.broadcastIdLocationOverride || `${data.mainCity?.name}, ${data.mainCity?.country}`}
                </div>
                <div className="ws4000-id-line-weatherid">
                  Local weather ID: {settings.broadcastIdWeatherId || '4275'}
                </div>

                {settings.broadcastIdLogoUrl && (
                  <div className="ws4000-id-operator-container">
                    <img src={settings.broadcastIdLogoUrl} alt="Cable Operator Logo" className="ws4000-id-operator-logo" />
                  </div>
                )}

                <div className="ws4000-id-line-channel" style={{ marginTop: settings.broadcastIdLogoUrl ? '0px' : '1.5rem' }}>
                  {settings.broadcastIdChannel || 'Channel 12'}
                </div>

                {settings.broadcastIdExtraText && (
                  <div className="ws4000-id-line-extra">
                    {settings.broadcastIdExtraText}
                  </div>
                )}

                {settings.broadcastIdCustomText && (
                  <div className="ws4000-id-custom-text" style={{ marginTop: '1rem' }}>
                    {formatCustomText(settings.broadcastIdCustomText)}
                  </div>
                )}

                {systemInfo && (
                  <div className="ws4000-id-sys-debug" style={{ marginTop: 'auto' }}>
                    <div className="ws4000-id-sys-debug-title">
                      SISTEMA DE TELEMETRÍA EN VIVO
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem 1.5rem', fontSize: '1.05rem', opacity: 0.9 }}>
                      <div>SOFTWARE: Next.js v{systemInfo.nextVersion} | React v{systemInfo.reactVersion}</div>
                      <div>CPU: {systemInfo.cpuUsage}%</div>
                      <div>ENTORNO: Node.js {systemInfo.nodeVersion} | {systemInfo.platform}</div>
                      <div>RAM (SISTEMA): {systemInfo.systemMemory.used} GB / {systemInfo.systemMemory.total} GB ({systemInfo.systemMemory.percent}%)</div>
                      <div>UPTIME: {Math.floor(systemInfo.uptime / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m {systemInfo.uptime % 60}s</div>
                      <div>RAM (PROCESO): RSS: {systemInfo.processMemory.rss} MB | HEAP: {systemInfo.processMemory.heapUsed} MB</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Copyright box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, justifyContent: 'center' }}>
                <div className="ws4000-id-copyright-box">
                  <div className="ws4000-id-copyright-title">DERECHOS DE AUTOR</div>
                  <div className="ws4000-id-copyright-content">
                    {formatCustomText(settings.broadcastIdCopyrightText || 'DERECHOS DE AUTOR Y ATRIBUCIONES:\n- DATOS DE CLIMA: © OPEN-METEO API\n- MAPAS Y CAPAS: © COLABORADORES DE OPENSTREETMAP\n- GRÁFICOS RETRO: INSPIRACIÓN ORIGINAL WEATHERSTAR (TWC)\n- MÚSICA DE FONDO: INTERNET ARCHIVE (WEATHERSCAN)\n- FUENTES RETRO: RECREACIONES ESTAR3000/4000/JR.')}
                  </div>
                </div>
              </div>
            </div>

            <div className="ws4000-id-footer-datetime" style={{ marginTop: '1.5rem' }}>
              {mounted && currentTime ? formatBroadcastDate(currentTime, settings.broadcastIdTimezone || '') : ''}
            </div>
          </div>
        </div>
      )}

      {/* CRT Flash overlay for transitions */}
      <div className={`crt-flash-overlay ${isCrtTransition ? 'crt-flash-active' : ''}`} />

      {/* Admin and Audio Controls bar */}
      {!settings.kioskMode && showDock && (
        <div
          style={{
            position: 'fixed',
            bottom: '98px',
            right: '25px',
            background: 'rgba(2, 4, 30, 0.85)',
            border: '2px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 500,
            backdropFilter: 'blur(5px)',
            transition: 'opacity 0.3s ease, border-color var(--theme-transition-duration, 3s) ease-in-out',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          }}
        >
          <Link
            href="/admin"
            style={{
              color: '#00f0ff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 'bold',
            }}
          >
            ⚙️ Panel Admin
          </Link>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Audio toggle */}
          {settings.musicEnabled && unlocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={toggleMute}
                style={{ background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '1.2rem', cursor: 'pointer' }}
                title={musicMutedByUser ? 'Activar sonido' : 'Silenciar'}
              >
                {musicMutedByUser ? '🔇' : '🔊'}
              </button>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>Sonido</span>
            </div>
          )}

          {settings.voiceoverEnabled && (
            <>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setVoiceoverMuted((prev) => !prev)}
                  style={{ background: 'transparent', border: 'none', color: '#ecc94b', fontSize: '1.2rem', cursor: 'pointer' }}
                  title={voiceoverMuted ? 'Activar Locución' : 'Silenciar Locución'}
                >
                  {voiceoverMuted ? '🔇🗣️' : '🗣️'}
                </button>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e0' }}>Locución</span>
              </div>
            </>
          )}

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Play/Pause slideshow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              style={{
                background: isPaused ? '#38a169' : '#e53e3e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {isPaused ? 'Reanudar ▶️' : 'Pausar ⏸️'}
            </button>
            <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Espacio</span>
          </div>
        </div>
      )}
    </div>
  );
}
