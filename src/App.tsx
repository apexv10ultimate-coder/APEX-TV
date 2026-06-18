import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  RotateCw, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Maximize2, 
  Minimize2,
  ExternalLink,
  Wifi,
  Sparkles,
  Command,
  Info
} from 'lucide-react';
import apexLogo from './assets/logo.png';

type DeviceEnvironment = 'tv' | 'mobile' | 'tablet';

export default function App() {
  const [env, setEnv] = useState<DeviceEnvironment>('tv');
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Custom Startup Cinematic Splash Screen
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [fadeOutSplash, setFadeOutSplash] = useState<boolean>(false);
  const [splashProgress, setSplashProgress] = useState<number>(0);
  
  // Controls auto-hiding of the ultra-minimal action pill
  const [showControls, setShowControls] = useState<boolean>(true);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TARGET_URL = "https://vavoo.to";

  // 1. Intelligent Context/Environment Auto-Detection
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isTVDevice = /googletv|androidtv|smart-tv|smarttv|appletv|hbbtv|netcast|viera|roku|tizen|playstation|xbox|linux arm/i.test(ua);
    const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTabletDevice = isMobileDevice && (window.innerWidth >= 768 || window.innerHeight >= 768);

    if (isTVDevice) {
      setEnv('tv');
    } else if (isTabletDevice) {
      setEnv('tablet');
    } else if (isMobileDevice) {
      setEnv('mobile');
    } else {
      setEnv(window.innerWidth >= 1200 ? 'tv' : 'tablet');
    }
  }, []);

  // 2. Cinematic Splash Screen Progress simulation & auto fade-out
  useEffect(() => {
    // Fill the loading bar over 2.4 seconds
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 50);

    const timer = setTimeout(() => {
      setFadeOutSplash(true);
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 700); // Wait for the opacity fade transition to complete
      return () => clearTimeout(removeTimer);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // 3. Intelligent Auto-Hiding Controller Logic
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500); // 4.5 seconds of activity before absolute immersion
  };

  useEffect(() => {
    if (showSplash) return; // Disable timeout logs while in splash screen

    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('touchstart', resetControlsTimeout);
    window.addEventListener('keydown', resetControlsTimeout);
    
    resetControlsTimeout();

    return () => {
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('touchstart', resetControlsTimeout);
      window.removeEventListener('keydown', resetControlsTimeout);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showSplash]);

  // Keyboard navigation adapted for Android TV D-Pad Remotes
  useEffect(() => {
    const handleRemoteKeys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
        handleRefresh();
      }
      if (e.key === 'Backspace' || e.key === 'Escape') {
        setShowControls(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleRemoteKeys);
    return () => window.removeEventListener('keydown', handleRemoteKeys);
  }, []);

  const handleRefresh = () => {
    setIsIframeLoaded(false);
    setIframeKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#020204] text-zinc-100 flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* 4. Cinematic Splash Screen Overlay (Centered, Pulsing Logo with Neon glow) */}
      {showSplash && (
        <div 
          className={`fixed inset-0 bg-[#040406] flex flex-col items-center justify-center z-[9999] transition-all duration-700 ease-out p-6 ${
            fadeOutSplash ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
          id="splash-loading-screen"
        >
          {/* Circular Ambient light behind logo */}
          <div 
            className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none animate-pulse opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(173, 248, 79, 0.18) 0%, rgba(0, 0, 0, 0) 70%)',
            }}
          />

          <div className="flex flex-col items-center max-w-sm w-full relative z-10 text-center">
            
            {/* Custom User Logo Render with neon green glow filter */}
            <div className="mb-8 transform hover:scale-105 transition-all duration-500">
              <img 
                src={apexLogo} 
                alt="Logo APEX" 
                className="w-44 md:w-52 h-auto object-contain select-none"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(173, 248, 79, 0.4))'
                }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback icon in case image is missing or corrupted
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('splash-fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              
              {/* Fallback Icon if PNG failed */}
              <div id="splash-fallback-icon" className="hidden flex-col items-center justify-center">
                <div className="w-20 h-20 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-center shadow-lg mb-4">
                  <Tv className="w-10 h-10 text-[#ADF84F]" />
                </div>
                <h1 className="text-xl font-black font-mono tracking-widest text-white leading-none">APEX TV</h1>
              </div>
            </div>

            {/* Smart Adaptability Description tag */}
            <div className="space-y-1 mt-2">
              <p className="text-[10px] font-black font-mono tracking-widest text-[#ADF84F] uppercase">
                DÉCODEUR IPTV INTELLIGENT
              </p>
              <h2 className="text-sm font-semibold text-zinc-300 font-sans tracking-tight">
                Mise en relation avec Vavoo Media Center...
              </h2>
            </div>

            {/* Premium Simulated Loading Progress Bar */}
            <div className="w-48 h-[3px] bg-zinc-900 rounded-full overflow-hidden mt-8 relative border border-zinc-950">
              <div 
                className="h-full bg-[#ADF84F] transition-all duration-75 ease-out rounded-full shadow-[0_0_10px_#ADF84F]"
                style={{ width: `${splashProgress}%` }}
              />
            </div>

            {/* Platform Identification Notification */}
            <span className="text-[9px] font-mono text-zinc-650 uppercase tracking-widest mt-4 block">
              PROFIL ADAPTATIF : {env === 'tv' ? 'Android TV Config' : env === 'tablet' ? 'Format Tablette' : 'Optimisation Mobile'}
            </span>
          </div>
        </div>
      )}

      {/* Ambient Glow for Active Controls */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-1000 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(173, 248, 79, 0.05) 0%, rgba(0, 0, 0, 0) 80%)',
          opacity: showControls ? 1 : 0
        }}
        id="tv-ambient-backdrop"
      />

      {/* Immersive Viewport Layout Frame */}
      <div className="flex-1 w-full h-full relative z-10 flex items-center justify-center">
        
        {/* Device constraint logic */}
        <div 
          className="w-full h-full transition-all duration-500 ease-in-out flex items-center justify-center relative"
          style={{
            maxWidth: env === 'mobile' ? '460px' : '100%',
            maxHeight: env === 'mobile' ? '820px' : '100%',
            aspectRatio: env === 'mobile' ? '9/16' : undefined,
            borderRadius: env === 'mobile' ? '32px' : '0px',
            border: env === 'mobile' ? '12px solid #18181b' : 'none',
            boxShadow: env === 'mobile' ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : 'none'
          }}
          id="main-viewport-container"
        >
          
          {env === 'mobile' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-[#18181b] rounded-full z-30" />
          )}

          {/* IFrame Loading overlay */}
          {!isIframeLoaded && (
            <div 
              className="absolute inset-0 bg-[#040406]/98 flex flex-col items-center justify-center p-6 text-center select-none z-20 pointer-events-none transition-all duration-300"
              id="stream-handshake-screen"
            >
              <div 
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" 
                style={{ borderColor: 'rgba(173, 248, 79, 0.1)', borderTopColor: '#ADF84F' }}
              />
              <span className="text-[10px] font-black font-mono tracking-widest text-[#ADF84F] block uppercase leading-none">
                Liaison Vavoo en cours
              </span>
              
              <div className="mt-4 flex items-center gap-3 pointer-events-auto">
                <button
                  onClick={() => setIsIframeLoaded(true)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono font-bold border border-zinc-800 transition-all active:scale-95 shadow"
                >
                  Passer l'attente
                </button>
                <a
                  href={TARGET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#ADF84F] text-black rounded-xl text-xs font-mono font-bold transition-all active:scale-95 shadow flex items-center gap-1.5"
                >
                  Lancer Direct
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Core embedded WebView */}
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={TARGET_URL}
            onLoad={() => setIsIframeLoaded(true)}
            className="w-full h-full border-none bg-black flex-1 relative z-10"
            id="vavoo-core-renderer"
            title="VAVOO IPTV Engine"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />

        </div>

      </div>

      {/* 5. Minimal Cinematic Action Overlay (Auto hides after inactivity) */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-45 transition-all duration-700 w-full max-w-2xl px-4 pointer-events-none ${
          showControls ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
        }`}
        id="floating-intelligent-controller"
      >
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-900 rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
          
          {/* Logo & status label */}
          <div className="flex items-center gap-3 select-none shrink-0" id="smart-status-indicator">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center p-1 overflow-hidden">
              <img 
                src={apexLogo} 
                alt="APEX icon" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-400">APEX TV</span>
                <span className="px-1.5 py-0.5 rounded bg-[#ADF84F]/10 border border-[#ADF84F]/20 text-[8px] font-black text-[#ADF84F] tracking-widest uppercase">
                  OK
                </span>
              </div>
              <p className="text-[9px] text-[#ADF84F] font-mono uppercase tracking-wider mt-0.5" id="environment-badge">
                ENV ADAPTÉ: {env.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Actions shortcuts */}
          <div className="flex items-center gap-2">
            
            {/* Quick manual Profiler Override */}
            <div className="flex bg-zinc-900 border border-zinc-850 p-1 rounded-xl gap-1 shrink-0">
              <button
                onClick={() => setEnv('tv')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${env === 'tv' ? 'bg-[#ADF84F] text-black' : 'text-zinc-500 hover:text-white'}`}
                title="Profiler pour Android TV"
                id="profile-tv-btn"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEnv('tablet')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${env === 'tablet' ? 'bg-[#ADF84F] text-black' : 'text-zinc-500 hover:text-white'}`}
                title="Profiler pour Tablette"
                id="profile-tablet-btn"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEnv('mobile')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${env === 'mobile' ? 'bg-[#ADF84F] text-black' : 'text-zinc-500 hover:text-white'}`}
                title="Profiler pour Smartphone"
                id="profile-phone-btn"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Easy reload trigger */}
            <button
              onClick={handleRefresh}
              className="px-3.5 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Rafraîchir"
              id="smart-refresh-btn"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RELOAD</span>
            </button>

            {/* Quick full-screen breakout */}
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 h-9 rounded-xl bg-[#ADF84F] hover:bg-[#bbf06b] text-zinc-950 font-mono text-xs font-black flex items-center gap-1.5 transition-all shadow active:scale-95 shrink-0"
              id="smart-fullscreen-launch-btn"
            >
              <span className="hidden sm:inline">PLEIN ÉCRAN</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Maximize Window Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-white flex items-center justify-center transition-all hidden md:flex shrink-0"
              title="Plein Écran Navigateur"
              id="toggle-window-fullscreen-btn"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Dynamic TV Remote & Smart Touch instruction hint lines */}
        <p className="text-center text-[9px] text-zinc-650 opacity-80 mt-2 font-mono uppercase tracking-widest select-none">
          {env === 'tv' 
            ? '💡 Astuce TV connectée : Utilisez la touche r ou Entrée de votre télécommande pour rafraîchir le signal' 
            : '💡 Glissez/Bougez le doigt n\'importe où pour faire réapparaître les raccourcis'}
        </p>
      </div>

    </div>
  );
}
