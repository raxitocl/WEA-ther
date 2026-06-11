'use client';

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface Settings {
  sidebarMediaMode?: 'none' | 'tv' | 'images';
  tvStreamType?: 'hls' | 'iframe' | 'blob';
  tvStreamUrl?: string;
  tvStreamVolume?: number;
  slideshowImages?: string[];
  slideshowDuration?: number;
  slideshowTransition?: 'fade' | 'slide' | 'zoom';
  slideshowFit?: 'cover' | 'contain';
  cityScrollSpeed?: number;
}

interface SidebarMediaProps {
  settings: Settings;
  onTvActive: (active: boolean) => void;
  voiceoverSpeaking?: boolean;
  resolvedTvStreamUrl?: string;
}

// Helper function to translate standard YouTube URLs to embed URLs
function getEmbedUrl(url: string, type: 'hls' | 'iframe' | 'blob'): string {
  if (!url) return '';
  if (type !== 'iframe') return url;

  const watchRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(watchRegex);
  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
  }
  return url;
}

export default function SidebarMedia({ settings, onTvActive, voiceoverSpeaking = false, resolvedTvStreamUrl = '' }: SidebarMediaProps) {
  const {
    sidebarMediaMode = 'none',
    tvStreamType = 'hls',
    tvStreamUrl = '',
    tvStreamVolume = 0.5,
    slideshowImages = [],
    slideshowDuration = 5,
    slideshowTransition = 'fade',
    slideshowFit = 'cover'
  } = settings;

  const activeTvUrl = resolvedTvStreamUrl || tvStreamUrl;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const volumeFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeVolumeFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIframeVolumeRef = useRef<number>(tvStreamVolume);
  const lastIframeUrlRef = useRef<string>('');
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Reset error when mode, stream type, or URL changes
  useEffect(() => {
    setVideoError(null);
  }, [sidebarMediaMode, tvStreamType, activeTvUrl]);

  // Notify parent component about TV audio muting needs
  useEffect(() => {
    const isTvActive = sidebarMediaMode === 'tv';
    onTvActive(isTvActive);
    return () => {
      onTvActive(false);
    };
  }, [sidebarMediaMode, onTvActive]);

  // HLS stream playback handling
  useEffect(() => {
    if (sidebarMediaMode !== 'tv' || tvStreamType !== 'hls') return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const handleLoadedMetadata = () => {
      video.play().catch(e => console.log('Native HLS autoplay failed:', e));
    };

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(activeTvUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('HLS autoplay blocked or failed:', e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          setVideoError(`Falla en señal HLS (${data.details}). Verifique la URL.`);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS playback fallback
      video.src = activeTvUrl;
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [sidebarMediaMode, tvStreamType, activeTvUrl]);

  // Blob video playback handling
  useEffect(() => {
    if (sidebarMediaMode !== 'tv' || tvStreamType !== 'blob') return;
    const video = videoRef.current;
    if (!video) return;

    video.src = activeTvUrl;
    video.play().catch(e => console.log('Blob video play failed:', e));

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [sidebarMediaMode, tvStreamType, activeTvUrl]);

  // TV Volume control (includes voiceover ducking with smooth transitions)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetVolume = voiceoverSpeaking ? tvStreamVolume * 0.15 : tvStreamVolume;

    if (volumeFadeIntervalRef.current) {
      clearInterval(volumeFadeIntervalRef.current);
      volumeFadeIntervalRef.current = null;
    }

    if (video.paused || video.muted) {
      video.volume = targetVolume;
      return;
    }

    const duration = 600; // 600ms fade transition
    const stepTime = 30;  // 30ms interval step
    const totalSteps = duration / stepTime;
    let currentStep = 0;
    const startVolume = video.volume;
    const volumeDiff = targetVolume - startVolume;

    if (Math.abs(volumeDiff) < 0.01) {
      video.volume = targetVolume;
      return;
    }

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const nextVolume = startVolume + volumeDiff * progress;
      video.volume = Math.max(0, Math.min(1, nextVolume));

      if (currentStep >= totalSteps) {
        video.volume = targetVolume;
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
  }, [tvStreamVolume, sidebarMediaMode, voiceoverSpeaking]);

  // YouTube/iframe Volume control (includes voiceover ducking with smooth transitions)
  useEffect(() => {
    if (sidebarMediaMode !== 'tv' || tvStreamType !== 'iframe' || !iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Reset volume tracker on URL changes
    if (lastIframeUrlRef.current !== activeTvUrl) {
      lastIframeUrlRef.current = activeTvUrl;
      currentIframeVolumeRef.current = tvStreamVolume;
    }

    const targetVolPercent = Math.round((voiceoverSpeaking ? tvStreamVolume * 0.15 : tvStreamVolume) * 100);

    if (iframeVolumeFadeIntervalRef.current) {
      clearInterval(iframeVolumeFadeIntervalRef.current);
      iframeVolumeFadeIntervalRef.current = null;
    }

    const sendVolumeCommand = (vol: number) => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [vol]
          }),
          '*'
        );
      } catch (e) {
        console.error('Error sending volume command to YouTube iframe:', e);
      }
    };

    // Interpolate volume steps to avoid saturating postMessage channel
    const startVolPercent = Math.round(currentIframeVolumeRef.current * 100);
    const volumeDiff = targetVolPercent - startVolPercent;

    if (Math.abs(volumeDiff) < 2) {
      sendVolumeCommand(targetVolPercent);
      currentIframeVolumeRef.current = targetVolPercent / 100;
      
      const timer1 = setTimeout(() => sendVolumeCommand(targetVolPercent), 1000);
      const timer2 = setTimeout(() => sendVolumeCommand(targetVolPercent), 3000);
      const timer3 = setTimeout(() => sendVolumeCommand(targetVolPercent), 5000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    const duration = 600; // 600ms fade transition
    const stepTime = 40;  // 40ms interval step (slower to reduce message spam)
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const nextVol = Math.round(startVolPercent + volumeDiff * progress);
      
      sendVolumeCommand(nextVol);
      currentIframeVolumeRef.current = nextVol / 100;

      if (currentStep >= totalSteps) {
        sendVolumeCommand(targetVolPercent);
        currentIframeVolumeRef.current = targetVolPercent / 100;
        if (iframeVolumeFadeIntervalRef.current === interval) {
          clearInterval(interval);
          iframeVolumeFadeIntervalRef.current = null;
        }
      }
    }, stepTime);

    iframeVolumeFadeIntervalRef.current = interval;

    // Initial send delay timers to lock volume when iframe is loading
    const timer1 = setTimeout(() => sendVolumeCommand(targetVolPercent), 1000);
    const timer2 = setTimeout(() => sendVolumeCommand(targetVolPercent), 3000);
    const timer3 = setTimeout(() => sendVolumeCommand(targetVolPercent), 5000);

    return () => {
      clearInterval(interval);
      if (iframeVolumeFadeIntervalRef.current === interval) {
        iframeVolumeFadeIntervalRef.current = null;
      }
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [sidebarMediaMode, tvStreamType, activeTvUrl, tvStreamVolume, voiceoverSpeaking]);

  // Slideshow interval timer
  useEffect(() => {
    if (sidebarMediaMode !== 'images' || slideshowImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImgIndex(prev => (prev + 1) % slideshowImages.length);
    }, slideshowDuration * 1000);

    return () => clearInterval(interval);
  }, [sidebarMediaMode, slideshowImages.length, slideshowDuration]);

  // Reset index when entering images mode or when image list changes
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [sidebarMediaMode, slideshowImages.length]);

  const getImageUrl = (img: string) => {
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('blob:') || img.startsWith('/')) {
      return img;
    }
    return `/images/${img}`;
  };

  if (sidebarMediaMode === 'none') {
    return null;
  }

  return (
    <div className="sidebar-media-panel" style={{ height: '100%' }}>
      {sidebarMediaMode === 'tv' && (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
          {videoError && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(20, 0, 0, 0.95)',
              border: '2px dashed var(--text-red, #ff3333)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.2rem',
              color: 'var(--text-red, #ff3333)',
              textAlign: 'center',
              fontFamily: 'var(--font-retro), monospace',
              zIndex: 10,
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.4rem', filter: 'drop-shadow(0 0 5px #f00)' }}>⚠️</span>
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                FALLA DE SEÑAL
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.4', margin: '0 0 1rem 0', fontFamily: 'var(--font-retro), sans-serif' }}>
                {videoError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVideoError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.4rem 1.2rem',
                  background: 'var(--text-red, #ff3333)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-retro), monospace',
                  boxShadow: '0 0 10px rgba(255, 51, 51, 0.5)',
                  textTransform: 'uppercase'
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {(tvStreamType === 'hls' || tvStreamType === 'blob') && (
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              controls
              playsInline
              autoPlay
              onError={() => {
                const err = videoRef.current?.error;
                let msg = 'Falla al cargar la señal de video.';
                if (err) {
                  if (err.code === 1) msg = 'Carga de video abortada.';
                  else if (err.code === 2) msg = 'Error de red al acceder a la señal.';
                  else if (err.code === 3) msg = 'Error de decodificación del video.';
                  else if (err.code === 4) {
                    if (activeTvUrl.toLowerCase().startsWith('blob:')) {
                      msg = 'Los enlaces blob:// son locales y temporales de la sesión de origen. No se admite su reproducción externa por restricciones de seguridad (Same-Origin Policy). Utilice un enlace M3U8 directo o un Iframe Embed.';
                    } else {
                      msg = 'No se admite el formato de video/MIME, o el acceso fue bloqueado por políticas CORS.';
                    }
                  }
                }
                setVideoError(msg);
              }}
            />
          )}
          {tvStreamType === 'iframe' && activeTvUrl && (
            <iframe
              ref={iframeRef}
              src={getEmbedUrl(activeTvUrl, tvStreamType)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
          {!activeTvUrl && (
            <div style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0aec0',
              fontFamily: 'var(--font-retro)',
              fontSize: '1.2rem'
            }}>
              SIN SEÑAL
            </div>
          )}
        </div>
      )}

      {sidebarMediaMode === 'images' && (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#000'
        }}>
          {slideshowImages.length > 0 ? (
            slideshowTransition === 'slide' ? (
              // Horizontal slide transition container
              <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                transition: 'transform 0.6s ease-in-out',
                transform: `translateX(-${currentImgIndex * 100}%)`
              }}>
                {slideshowImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: '100%',
                      width: '100%',
                      height: '100%',
                      position: 'relative'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(img)}
                      alt={`slide-${idx}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: slideshowFit,
                        display: 'block'
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Fade / Zoom transitions (absolute layering)
              slideshowImages.map((img, idx) => {
                const isActive = idx === currentImgIndex;
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 0.8s ease-in-out',
                      zIndex: isActive ? 2 : 1,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(img)}
                      alt={`slide-${idx}`}
                      className={isActive && slideshowTransition === 'zoom' ? 'slideshow-zoom-image' : ''}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: slideshowFit,
                        display: 'block',
                        // Set zoom transition duration using dynamic css variable
                        ['--transition-duration' as any]: `${slideshowDuration}s`
                      }}
                    />
                  </div>
                );
              })
            )
          ) : (
            <div style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0aec0',
              fontFamily: 'var(--font-retro)',
              fontSize: '1.2rem',
              textAlign: 'center',
              padding: '1rem'
            }}>
              SIN IMÁGENES CONFIGURADAS
            </div>
          )}
        </div>
      )}
    </div>
  );
}
