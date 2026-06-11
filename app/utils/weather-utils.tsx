import React from 'react';

// Wrapper helper component to render retro GIFs with pixelated style
const createGifIconComponent = (src: string) => {
  const GifIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
    let width = '64px';
    let height = '64px';
    
    if (className) {
      if (className.includes('w-8')) { width = '32px'; }
      if (className.includes('h-8')) { height = '32px'; }
      if (className.includes('w-12')) { width = '48px'; }
      if (className.includes('h-12')) { height = '48px'; }
      if (className.includes('w-16')) { width = '64px'; }
      if (className.includes('h-16')) { height = '64px'; }
      if (className.includes('w-20')) { width = '80px'; }
      if (className.includes('h-20')) { height = '80px'; }
      if (className.includes('w-24')) { width = '96px'; }
      if (className.includes('h-24')) { height = '96px'; }
      if (className.includes('w-32')) { width = '128px'; }
      if (className.includes('h-32')) { height = '128px'; }
    }
    
    return (
      <img 
        src={src} 
        className={className} 
        style={{ 
          width,
          height,
          imageRendering: 'pixelated', 
          objectFit: 'contain',
          ...style 
        }} 
        alt="weather icon" 
      />
    );
  };
  GifIcon.displayName = `GifIcon(${src.split('/').pop()})`;
  return GifIcon;
};


// WeatherStar 4000 GIF Weather Icons mapping (extracted from ccef.zip)
export const CC_Clear1 = createGifIconComponent('/images/weather/ccef/CC_Clear1.gif');
export const CC_MostlyCloudy1 = createGifIconComponent('/images/weather/ccef/CC_MostlyCloudy1.gif');
export const CC_PartlyCloudy1 = createGifIconComponent('/images/weather/ccef/CC_PartlyCloudy1.gif');
export const CC_Cloudy = createGifIconComponent('/images/weather/ccef/CC_Cloudy.gif');
export const CC_Fog = createGifIconComponent('/images/weather/ccef/CC_Fog.gif');
export const CC_FreezingRain = createGifIconComponent('/images/weather/ccef/CC_FreezingRain.gif');
export const CC_Mix = createGifIconComponent('/images/weather/ccef/CC_Mix.gif');
export const CC_Rain = createGifIconComponent('/images/weather/ccef/CC_Rain.gif');
export const CC_RainSnow = createGifIconComponent('/images/weather/ccef/CC_RainSnow.gif');
export const CC_Showers = createGifIconComponent('/images/weather/ccef/CC_Showers.gif');
export const CC_Snow = createGifIconComponent('/images/weather/ccef/CC_Snow.gif');
export const CC_SnowShowers = createGifIconComponent('/images/weather/ccef/CC_SnowShowers.gif');
export const CC_Thunder = createGifIconComponent('/images/weather/ccef/CC_Thunder.gif');
export const CC_ThunderSnow = createGifIconComponent('/images/weather/ccef/CC_ThunderSnow.gif');
export const CC_TStorm = createGifIconComponent('/images/weather/ccef/CC_TStorm.gif');
export const CC_Windy = createGifIconComponent('/images/weather/ccef/CC_Windy.gif');
export const EF_IsolatedTstorms = createGifIconComponent('/images/weather/ccef/EF_IsolatedTstorms.gif');
export const EF_ScatShowers = createGifIconComponent('/images/weather/ccef/EF_ScatShowers.gif');
export const EF_ScatSnowShowers = createGifIconComponent('/images/weather/ccef/EF_ScatSnowShowers.gif');
export const EF_ScatTstorms = createGifIconComponent('/images/weather/ccef/EF_ScatTstorms.gif');

// Redefine base exported icons for backward compatibility with SVGs
export const SunIcon = CC_Clear1;
export const CloudSunIcon = CC_PartlyCloudy1;
export const CloudIcon = CC_Cloudy;
export const FogIcon = CC_Fog;
export const RainIcon = CC_Rain;
export const ThunderstormIcon = CC_TStorm;
export const SnowIcon = CC_Snow;

export interface WeatherDetails {
  description: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function getWeatherDetails(code: number | null | undefined): WeatherDetails {
  if (code === null || code === undefined) {
    return { description: 'Desconocido', Icon: CC_Cloudy };
  }

  // Map WMO Weather Codes to Retro description and GIF Icons
  switch (code) {
    case 0:
      return { description: 'Despejado', Icon: CC_Clear1 };
    case 1:
      return { description: 'Mayormente Despejado', Icon: CC_MostlyCloudy1 };
    case 2:
      return { description: 'Parcialmente Nublado', Icon: CC_PartlyCloudy1 };
    case 3:
      return { description: 'Nublado', Icon: CC_Cloudy };
    
    // Fog
    case 45:
    case 48:
      return { description: 'Niebla', Icon: CC_Fog };
    
    // Drizzle
    case 51:
    case 53:
    case 55:
      return { description: 'Llovizna', Icon: CC_Showers };
    case 56:
    case 57:
      return { description: 'Llovizna Helada', Icon: CC_FreezingRain };
    
    // Rain
    case 61:
      return { description: 'Lluvia Ligera', Icon: CC_Rain };
    case 63:
      return { description: 'Lluvia Moderada', Icon: CC_Rain };
    case 65:
      return { description: 'Lluvia Fuerte', Icon: CC_Rain };
    case 66:
    case 67:
      return { description: 'Lluvia Helada', Icon: CC_FreezingRain };
    
    // Snow
    case 71:
      return { description: 'Nieve Ligera', Icon: CC_Snow };
    case 73:
      return { description: 'Nieve Moderada', Icon: CC_Snow };
    case 75:
      return { description: 'Nieve Fuerte', Icon: CC_Snow };
    case 77:
      return { description: 'Granizo de Nieve', Icon: CC_Snow };
    
    // Showers
    case 80:
    case 81:
    case 82:
      return { description: 'Chubascos', Icon: EF_ScatShowers };
    case 85:
    case 86:
      return { description: 'Chubascos de Nieve', Icon: EF_ScatSnowShowers };
    
    // Thunderstorms
    case 95:
      return { description: 'Tormenta Eléctrica', Icon: CC_TStorm };
    case 96:
    case 99:
      return { description: 'Tormenta con Granizo', Icon: CC_Thunder };
      
    default:
      return { description: 'Condiciones Variables', Icon: CC_PartlyCloudy1 };
  }
}

// Convert wind direction in degrees to compass direction abbreviation
export function getWindDirectionText(degrees: number | null | undefined): string {
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
