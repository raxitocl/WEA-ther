'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RadarPoint {
  name: string;
  latitude: number;
  longitude: number;
  temp: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  windDir: number | null;
}

interface RadarMapProps {
  latitude: number;
  longitude: number;
  radarPoints: RadarPoint[];
  radarType: 'precipitation' | 'wind' | 'temperature';
  unitSystem: 'metric' | 'imperial';
  radarColorScheme?: 'standard' | 'dark' | 'light' | 'satellite' | 'retro_green';
  cardinalSizeMultiplier?: number;
}

export default function RadarMap({
  latitude,
  longitude,
  radarPoints,
  radarType,
  unitSystem,
  radarColorScheme = 'retro_green',
  cardinalSizeMultiplier = 1.0
}: RadarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Dynamically load Leaflet script and stylesheet in browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Check if stylesheet is already in document
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Check if script is already in document
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
      // If it exists but not loaded on window, wait or check
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

  // Initialize and update the map instance
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Destroy existing map instance to prevent duplication
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create map centered on main city (maxZoom: 7 matches free tier RainViewer API limit)
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 7,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Select base tile layer based on radarColorScheme settings
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
    }).addTo(map);

    // Main city indicator marker
    const mainCityIcon = L.divIcon({
      className: 'custom-main-city-pin',
      html: `<div style="background: #ffff00; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #000; box-shadow: 0 0 10px #ffff00; animation: pulse-radar-main 2s infinite ease-in-out;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    L.marker([latitude, longitude], { icon: mainCityIcon }).addTo(map);

    // 1. Overlay RainViewer Precipitation Tiles if active
    if (radarType === 'precipitation') {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
            const path = data.radar.past[data.radar.past.length - 1].path;
            L.tileLayer(`https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`, {
              opacity: 0.75,
              zIndex: 100
            }).addTo(map);
          }
        })
        .catch((err) => console.error('Error fetching RainViewer tiles:', err));
    }

    // 2. Overlay regional indicators
    if (radarPoints && radarPoints.length > 0) {
      const isRetro = radarColorScheme === 'retro_green';
      const isLight = radarColorScheme === 'light';
      const markerColor = isRetro ? '#00ff66' : (isLight ? '#0055ff' : '#00f0ff');
      const markerBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)';
      const markerBorder = isRetro ? '2px solid #00ff66' : (isLight ? '2px solid #0055ff' : '2px solid #00f0ff');
      const labelBorder = isRetro ? '1px solid #00ff66' : (isLight ? '1px solid #4a5568' : '1px solid #00f0ff');
      const labelColor = isRetro ? '#00ff66' : (isLight ? '#1a202c' : '#00f0ff');

      radarPoints.forEach((point) => {
        if (point.latitude === null || point.longitude === null) return;
        
        // Skip rendering Norte, Sur, Este, Oeste as Leaflet map markers
        if (['norte', 'sur', 'este', 'oeste'].includes(point.name.toLowerCase())) return;

        let html = '';
        if (radarType === 'temperature' && point.temp !== null) {
          html = `<div style="background: ${markerBg}; color: ${markerColor}; border: ${markerBorder}; padding: 3px 6px; font-family: var(--font-retro), 'Share Tech Mono', monospace; font-size: 1rem; font-weight: bold; border-radius: 4px; box-shadow: 0 0 8px ${isLight ? 'rgba(0,85,255,0.4)' : 'rgba(0,240,255,0.6)'}; white-space: nowrap; text-align: center;">${Math.round(point.temp)}°</div>`;
        } else if (radarType === 'wind' && point.windSpeed !== null) {
          const rotation = point.windDir ?? 0;
          html = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 6px ${markerColor}); transition: transform 0.5s;">
                <path d="M12 2L17 9H14V22H10V9H7L12 2Z" fill="${markerColor}"/>
              </svg>
              <div style="background: ${markerBg}; color: ${markerColor}; border: ${markerBorder}; font-size: 0.8rem; font-family: var(--font-retro), 'Share Tech Mono', monospace; font-weight: bold; padding: 2px 4px; border-radius: 4px; margin-top: 3px; white-space: nowrap; box-shadow: 0 0 6px ${isLight ? 'rgba(0,85,255,0.3)' : 'rgba(0,240,255,0.4)'};">
                ${Math.round(point.windSpeed)}
              </div>
            </div>
          `;
        } else if (radarType === 'precipitation') {
          // Just generic name labels on the map in precipitation mode for orientation
          html = `<div style="background: ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'}; color: ${labelColor}; border: ${labelBorder}; font-size: 0.75rem; font-family: var(--font-retro), 'Share Tech Mono', monospace; padding: 2px 4px; border-radius: 3px; white-space: nowrap;">${point.name.toUpperCase()}</div>`;
        }

        if (html) {
          const icon = L.divIcon({
            className: `custom-div-icon-${radarType}`,
            html: html,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
          });
          L.marker([point.latitude, point.longitude], { icon }).addTo(map);
        }
      });
    }

    // Add keyframe animation styling for the pulses if needed
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-radar-main {
        0% { transform: scale(1); box-shadow: 0 0 10px #ffff00; }
        50% { transform: scale(1.2); box-shadow: 0 0 20px #ffff00, 0 0 30px rgba(255,255,0,0.5); }
        100% { transform: scale(1); box-shadow: 0 0 10px #ffff00; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      style.remove();
    };
  }, [leafletLoaded, latitude, longitude, radarType, radarPoints, unitSystem, radarColorScheme, cardinalSizeMultiplier]);

  const isRetro = radarColorScheme === 'retro_green';
  const containerBorder = isRetro ? '2px solid #00ff66' : '2px solid var(--panel-border, #00f0ff)';
  const containerShadow = isRetro ? '0 0 15px rgba(0, 255, 102, 0.2)' : '0 0 15px var(--panel-glow, rgba(0, 240, 255, 0.2))';

  const getCardinalOverlay = (direction: 'Norte' | 'Sur' | 'Este' | 'Oeste') => {
    if (!radarPoints || radarPoints.length === 0) return null;
    const point = radarPoints.find(p => p.name.toLowerCase() === direction.toLowerCase());
    if (!point) return null;

    const isLight = radarColorScheme === 'light';
    const markerColor = isRetro ? '#00ff66' : (isLight ? '#0055ff' : '#00f0ff');
    const markerBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)';
    const markerBorder = isRetro ? '2px solid #00ff66' : (isLight ? '2px solid #0055ff' : '2px solid #00f0ff');

    const shortName = direction === 'Norte' ? 'N' :
                      direction === 'Sur' ? 'S' :
                      direction === 'Este' ? 'E' : 'O';

    let content: React.ReactNode = null;

    if (radarType === 'temperature' && point.temp !== null) {
      content = <span>{shortName}: {Math.round(point.temp)}°</span>;
    } else if (radarType === 'wind' && point.windSpeed !== null) {
      const rotation = point.windDir ?? 0;
      content = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{shortName}:</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rotation}deg)`, filter: `drop-shadow(0 0 4px ${markerColor})`, display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M12 2L17 9H14V22H10V9H7L12 2Z" fill={markerColor}/>
          </svg>
          <span>{Math.round(point.windSpeed)}</span>
        </div>
      );
    } else {
      content = <span>{direction.toUpperCase()}</span>;
    }

    let positionStyle: React.CSSProperties = {};
    if (direction === 'Norte') {
      positionStyle = { top: '12px', left: '50%', transform: 'translateX(-50%)' };
    } else if (direction === 'Sur') {
      positionStyle = { bottom: '12px', left: '50%', transform: 'translateX(-50%)' };
    } else if (direction === 'Este') {
      positionStyle = { right: '12px', top: '50%', transform: 'translateY(-50%)' };
    } else if (direction === 'Oeste') {
      positionStyle = { left: '12px', top: '50%', transform: 'translateY(-50%)' };
    }

    return (
      <div style={{
        position: 'absolute',
        ...positionStyle,
        background: markerBg,
        color: markerColor,
        border: markerBorder,
        padding: '4px 8px',
        fontFamily: "var(--font-retro), 'Share Tech Mono', monospace",
        fontSize: `${0.85 * cardinalSizeMultiplier}rem`,
        fontWeight: 'bold',
        borderRadius: '4px',
        boxShadow: `0 0 8px ${isLight ? 'rgba(0,85,255,0.4)' : 'rgba(0,240,255,0.6)'}`,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {content}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px', borderRadius: '8px', overflow: 'hidden', border: containerBorder, boxShadow: containerShadow }}>
      {/* Dynamic green CRT phosphor filter overlay */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '380px',
          filter: isRetro ? 'hue-rotate(90deg) brightness(0.85) contrast(1.25) saturate(1.4) grayscale(0.2)' : 'none'
        }} 
      />
      {!leafletLoaded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: '#040924', color: isRetro ? '#00ff66' : 'var(--text-cyan, #00f0ff)', fontFamily: "var(--font-retro), 'Share Tech Mono', monospace", fontSize: '1.2rem'
        }}>
          SINTONIZANDO SEÑAL DE RADAR...
        </div>
      )}
      {leafletLoaded && getCardinalOverlay('Norte')}
      {leafletLoaded && getCardinalOverlay('Sur')}
      {leafletLoaded && getCardinalOverlay('Este')}
      {leafletLoaded && getCardinalOverlay('Oeste')}
    </div>
  );
}
