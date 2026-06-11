'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CONTINENTS, ContinentConfig } from '../utils/continents';

interface ContinentalRadarMapProps {
  continentKey: string;
  weatherData: any[]; // Array of { name, country, latitude, longitude, temp, weatherCode, pop }
  slideProgress?: number; // 0 to 100 progress value (optional, for synced slideshows)
  slideDuration?: number; // slide duration in seconds (optional, fallback for standalone maps)
  radarColorScheme?: 'standard' | 'dark' | 'light' | 'satellite' | 'retro_green';
  scrollSpeed?: number;
  loopMode?: boolean;
  zoomLevel?: number;
  height?: string;
  minHeight?: string;
  capitalSizeMultiplier?: number;
  temperatureSizeMultiplier?: number;
  precipitationSizeMultiplier?: number;
}

function getWeatherIconGifString(code: number | null | undefined) {
  if (code === null || code === undefined) {
    return `<img src="/images/radar/rcrf/Cloudy.gif" width="22" height="22" style="display: block; image-rendering: pixelated; object-fit: contain;" />`;
  }
  let gifName = 'Cloudy.gif';
  if (code === 0) {
    gifName = 'Clear1.gif';
  } else if (code === 1) {
    gifName = 'MostlyCloudy1.gif';
  } else if (code === 2) {
    gifName = 'PartlyCloudy1.gif';
  } else if (code === 3) {
    gifName = 'Cloudy.gif';
  } else if (code === 45 || code === 48) {
    gifName = 'Fog.gif';
  } else if (code === 51 || code === 53 || code === 55) {
    gifName = 'Showers.gif';
  } else if (code === 56 || code === 57) {
    gifName = 'FreezingRain.gif';
  } else if (code >= 61 && code <= 65) {
    gifName = 'Rain.gif';
  } else if (code === 66 || code === 67) {
    gifName = 'FreezingRain.gif';
  } else if (code >= 71 && code <= 77) {
    gifName = 'Snow.gif';
  } else if (code >= 80 && code <= 82) {
    gifName = 'ScatShowers.gif';
  } else if (code >= 85 && code <= 86) {
    gifName = 'ScatSnowShowers.gif';
  } else if (code === 95) {
    gifName = 'TStorm.gif';
  } else if (code >= 96) {
    gifName = 'Thunder.gif';
  }
  return `<img src="/images/radar/rcrf/${gifName}" width="22" height="22" style="display: block; image-rendering: pixelated; object-fit: contain;" />`;
}

export default function ContinentalRadarMap({
  continentKey,
  weatherData,
  slideProgress,
  slideDuration = 12,
  radarColorScheme = 'retro_green',
  scrollSpeed = 1.0,
  loopMode = false,
  zoomLevel,
  height = '100%',
  minHeight = '380px',
  capitalSizeMultiplier = 1.0,
  temperatureSizeMultiplier = 1.0,
  precipitationSizeMultiplier = 1.0
}: ContinentalRadarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);

  const currentProgressRef = useRef(0);
  const mountTimeRef = useRef<number>(0);
  
  useEffect(() => {
    mountTimeRef.current = performance.now();
  }, []);

  // Dynamically load Leaflet script and stylesheet in browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[src*="leaflet.js"]');
    let checkInterval: NodeJS.Timeout | null = null;

    const handleLoad = () => {
      if (isMounted) {
        setLeafletLoaded(true);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = handleLoad;
      document.head.appendChild(script);
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).L) {
          if (isMounted) {
            setLeafletLoaded(true);
          }
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  // Initialize map and handle tile layers/markers
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const config: ContinentConfig = CONTINENTS[continentKey] || CONTINENTS.south_america;
    const { startLat, centerLng, defaultZoom } = config;
    const initialZoom = zoomLevel !== undefined ? zoomLevel : defaultZoom;

    // Create map centered on starting latitude
    const mapInstance = L.map(mapRef.current, {
      center: [startLat, centerLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false
    });

    // Base Tile Layer selection
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // default/dark/retro_green
    if (radarColorScheme === 'standard') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (radarColorScheme === 'light') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    } else if (radarColorScheme === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 18,
      attribution: false
    }).addTo(mapInstance);

    const isRetro = radarColorScheme === 'retro_green';
    const isLight = radarColorScheme === 'light';
    const markerColor = isRetro ? '#00ff66' : (isLight ? '#0055ff' : '#00f0ff');
    const markerBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)';
    const markerBorder = isRetro ? '2px solid #00ff66' : (isLight ? '2px solid #0055ff' : '2px solid #00f0ff');

    // Precompute label offsets for overlapping cities
    const offsets: { [key: string]: { x: number; y: number } } = {};
    if (weatherData) {
      weatherData.forEach((c) => {
        offsets[c.name] = { x: 0, y: 0 };
      });

      for (let i = 0; i < weatherData.length; i++) {
        for (let j = i + 1; j < weatherData.length; j++) {
          const c1 = weatherData[i];
          const c2 = weatherData[j];
          if (
            c1.latitude === null || c1.longitude === null ||
            c2.latitude === null || c2.longitude === null
          ) continue;

          const dLat = Math.abs(c1.latitude - c2.latitude);
          const dLng = Math.abs(c1.longitude - c2.longitude);

          // Threshold for continental zoom levels where overlap is likely (e.g. Buenos Aires and Montevideo)
          if (dLat < 1.5 && dLng < 2.8) {
            // Determine relative positions to push them apart
            if (c1.longitude < c2.longitude) {
              offsets[c1.name].x -= 22;
              offsets[c2.name].x += 22;
            } else {
              offsets[c1.name].x += 22;
              offsets[c2.name].x -= 22;
            }

            if (c1.latitude < c2.latitude) {
              offsets[c1.name].y += 12;
              offsets[c2.name].y -= 12;
            } else {
              offsets[c1.name].y -= 12;
              offsets[c2.name].y += 12;
            }
          }
        }
      }
    }

    // Add markers for continental cities
    if (weatherData && weatherData.length > 0) {
      weatherData.forEach((city) => {
        if (city.latitude === null || city.longitude === null) return;

        const iconGif = getWeatherIconGifString(city.weatherCode);
        const tempVal = city.temp !== null ? `${Math.round(city.temp)}°` : '--°';
        const popVal = city.pop > 0 ? `<div style="color: ${isLight ? '#0077cc' : '#29b6f6'}; font-size: ${0.75 * precipitationSizeMultiplier}rem; margin-top: 1px;">☔ ${city.pop}%</div>` : '';

        const badgeHtml = `
          <div style="background: ${markerBg}; color: ${markerColor}; border: ${markerBorder}; padding: 4px 6px; font-family: var(--font-retro), 'Share Tech Mono', monospace; border-radius: 4px; box-shadow: 0 0 8px ${isLight ? 'rgba(0,85,255,0.3)' : 'rgba(0,240,255,0.5)'}; white-space: nowrap; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 65px; text-align: center; pointer-events: none;">
            <div style="font-size: ${0.7 * capitalSizeMultiplier}rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${city.name}</div>
            <div style="display: flex; align-items: center; gap: 4px;">
              ${iconGif}
              <span style="color: #ffff00; font-size: ${0.95 * temperatureSizeMultiplier}rem; font-weight: bold;">${tempVal}</span>
            </div>
            ${popVal}
          </div>
        `;

        const cityOffset = offsets[city.name] || { x: 0, y: 0 };
        const icon = L.divIcon({
          className: 'custom-continental-badge',
          html: badgeHtml,
          iconSize: [80, 50],
          iconAnchor: [40 - cityOffset.x, 25 - cityOffset.y]
        });

        L.marker([city.latitude, city.longitude], { icon }).addTo(mapInstance);
      });
    }

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, [leafletLoaded, continentKey, radarColorScheme, weatherData, capitalSizeMultiplier, temperatureSizeMultiplier, precipitationSizeMultiplier]);

  // Handle auto-scroll animation loop
  useEffect(() => {
    if (!map) return;
    const config: ContinentConfig = CONTINENTS[continentKey] || CONTINENTS.south_america;
    const { startLat, endLat, centerLng, defaultZoom } = config;
    const targetZoom = zoomLevel !== undefined ? zoomLevel : defaultZoom;

    let animationFrameId: number;
    let lastLat: number | null = null;
    let lastZoom: number | null = null;

    const animate = (time: number) => {
      let progress = 0;
      let shouldContinue = true;

      if (slideProgress !== undefined) {
        const targetProgress = slideProgress;
        
        if (targetProgress < currentProgressRef.current) {
          currentProgressRef.current = targetProgress;
        } else {
          const diff = targetProgress - currentProgressRef.current;
          if (currentProgressRef.current === 0 && targetProgress > 0) {
            currentProgressRef.current = targetProgress;
          } else {
            // Smooth catch-up interpolation
            currentProgressRef.current += diff * 0.15;
          }
        }
        progress = currentProgressRef.current / 100;
      } else {
        const elapsed = time - (mountTimeRef.current || performance.now());
        const durationMs = slideDuration * 1000;
        progress = elapsed / durationMs;
        if (progress >= 1.0) {
          progress = 1.0;
          shouldContinue = false;
        }
      }

      let finalProgress = 0;
      if (loopMode) {
        // Triangle wave oscillation between 0 and 1
        const totalProgress = progress * 2 * scrollSpeed;
        const cycle = totalProgress % 2;
        finalProgress = cycle < 1 ? cycle : 2 - cycle;
      } else {
        // Standard forward scroll clamped at 1.0
        finalProgress = progress * scrollSpeed;
        if (finalProgress >= 1.0) {
          finalProgress = 1.0;
        }
      }

      const currentLat = startLat + (endLat - startLat) * finalProgress;
      
      if (!map || !(map as any)._container || !(map as any)._mapPane) {
        return;
      }
      
      // Only update view if latitude or zoom actually changed significantly
      if (
        lastLat === null || 
        lastZoom === null || 
        Math.abs(currentLat - lastLat) > 0.00001 || 
        targetZoom !== lastZoom
      ) {
        try {
          map.setView([currentLat, centerLng], targetZoom, { animate: false });
          lastLat = currentLat;
          lastZoom = targetZoom;
        } catch (e) {
          // Silent catch to prevent Leaflet teardown crash if frame fires during unmount
        }
      }

      if (slideProgress !== undefined || shouldContinue) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [map, continentKey, slideProgress, slideDuration, scrollSpeed, loopMode, zoomLevel]);

  const isRetro = radarColorScheme === 'retro_green';
  const containerBorder = isRetro ? '2px solid #00ff66' : '2px solid var(--panel-border, #00f0ff)';
  const containerShadow = isRetro ? '0 0 15px rgba(0, 255, 102, 0.2)' : '0 0 15px var(--panel-glow, rgba(0, 240, 255, 0.2))';

  return (
    <div style={{ position: 'relative', width: '100%', height, minHeight, borderRadius: '8px', overflow: 'hidden', border: containerBorder, boxShadow: containerShadow }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight,
          filter: isRetro ? 'hue-rotate(90deg) brightness(0.85) contrast(1.25) saturate(1.4) grayscale(0.2)' : 'none'
        }} 
      />
      {!leafletLoaded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: '#040924', color: isRetro ? '#00ff66' : 'var(--text-cyan, #00f0ff)', fontFamily: 'var(--font-retro), monospace', fontSize: '1.2rem'
        }}>
          SINTONIZANDO RADAR CONTINENTAL...
        </div>
      )}
    </div>
  );
}
