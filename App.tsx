import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from './constants';
import { audioService } from './services/audioService';
import ParticleBackground from './components/ParticleBackground';
import { ThemeCard } from './components/ThemeCard';
import { Play, Pause, Maximize2, Timer, Settings, X, Volume2 } from 'lucide-react';
import { SoundMix } from './types';

const STORAGE_KEY = 'zentune_preferences_v2';

export default function App() {
  // State
  const [visualThemeId, setVisualThemeId] = useState<string>(THEMES[0].id);
  const [mix, setMix] = useState<SoundMix>({});
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
  const [isUIHidden, setIsUIHidden] = useState(false);
  
  // Timer State
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number | null>(null); // in minutes
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  
  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.visualThemeId) setVisualThemeId(parsed.visualThemeId);
        if (parsed.mix) setMix(parsed.mix);
        // Note: We do not auto-play globally for UX/Browser policy reasons, 
        // but we restore the 'mix' configuration.
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    }
  }, []);

  // Save preferences on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      visualThemeId,
      mix
    }));
  }, [visualThemeId, mix]);

  // Audio Engine Sync
  useEffect(() => {
    if (!isGlobalPlaying) {
      audioService.stopAll();
      return;
    }

    // If global playing is true, sync all active mix tracks
    Object.entries(mix).forEach(([themeId, state]) => {
      const theme = THEMES.find(t => t.id === themeId);
      if (!theme) return;

      if (state.isPlaying) {
        audioService.playSound(themeId, theme.noiseType, state.volume);
      } else {
        audioService.stopSound(themeId);
      }
    });
  }, [mix, isGlobalPlaying]);

  // Timer Logic
  useEffect(() => {
    if (!timerEndTime) {
      setRemainingTime('');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = timerEndTime - now;

      if (diff <= 0) {
        // Time's up
        setIsGlobalPlaying(false);
        setTimerEndTime(null);
        setTimerDuration(null);
        clearInterval(interval);
      } else {
        // Format remaining
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEndTime]);

  const activeVisualTheme = THEMES.find(t => t.id === visualThemeId) || THEMES[0];

  const toggleGlobalPlay = () => {
    setIsGlobalPlaying(!isGlobalPlaying);
    // If we start playing and mix is empty, start the active visual theme
    if (!isGlobalPlaying) {
      audioService.resumeContext();
      const activeSounds = Object.values(mix).filter(s => s.isPlaying).length;
      if (activeSounds === 0) {
         handleToggleAudio(visualThemeId);
      }
    }
  };

  const handleToggleAudio = (themeId: string) => {
    setMix(prev => {
      const current = prev[themeId] || { isPlaying: false, volume: 0.5 };
      return {
        ...prev,
        [themeId]: { ...current, isPlaying: !current.isPlaying }
      };
    });
    // If we turn on a sound, ensure global play is on
    if (!mix[themeId]?.isPlaying) {
      setIsGlobalPlaying(true);
      audioService.resumeContext();
    }
  };

  const handleVolumeChange = (themeId: string, vol: number) => {
    setMix(prev => ({
      ...prev,
      [themeId]: { ...(prev[themeId] || { isPlaying: true }), volume: vol }
    }));
  };

  const setTimer = (minutes: number | null) => {
    if (minutes === null) {
      setTimerEndTime(null);
      setTimerDuration(null);
    } else {
      setTimerDuration(minutes);
      setTimerEndTime(Date.now() + minutes * 60 * 1000);
    }
    setShowTimerModal(false);
  };

  const activeCount = Object.values(mix).filter(s => s.isPlaying).length;

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-1000 ${activeVisualTheme.bgGradient}`}>
      
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 opacity-40 mix-blend-overlay"
        style={{ 
          backgroundImage: `url('https://picsum.photos/seed/${activeVisualTheme.id}/1920/1080')` 
        }}
      />
      
      <div className={`absolute inset-0 transition-colors duration-1000 opacity-60 mix-blend-multiply ${activeVisualTheme.secondaryColor}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

      {/* Particles */}
      <ParticleBackground theme={activeVisualTheme} />

      {/* UI Container */}
      <div className={`relative z-20 h-full flex flex-col justify-between p-6 md:p-10 transition-opacity duration-500 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Top Bar */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white drop-shadow-lg">
              Zen<span className="font-semibold">Tune</span>
            </h1>
          </div>
          <div className="flex gap-4">
             {remainingTime && (
               <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white font-mono flex items-center gap-2 animate-pulse border border-white/10">
                 <Timer size={16} />
                 {remainingTime}
               </div>
             )}
             <button 
               onClick={() => setShowTimerModal(true)}
               className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all"
             >
               <Timer size={20} />
             </button>
             <button 
               onClick={() => setIsUIHidden(true)}
               className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all"
             >
               <Maximize2 size={20} />
             </button>
          </div>
        </header>

        {/* Active Visual Label */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center w-full px-4 pointer-events-none">
           <h2 className="text-5xl md:text-7xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight transition-all duration-700">
              {activeVisualTheme.name}
           </h2>
           <p className="text-xl text-white/80 font-light drop-shadow-md mb-8">
             {activeVisualTheme.description}
           </p>
           
           {/* Main Play Button (Centered) */}
           <button 
              onClick={toggleGlobalPlay}
              className={`
                pointer-events-auto
                w-20 h-20 rounded-full flex items-center justify-center 
                transition-all duration-500 shadow-2xl hover:scale-110
                ${isGlobalPlaying 
                  ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
                }
              `}
            >
              {isGlobalPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
            </button>
        </div>

        {/* Bottom Theme Selector */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-white/60 text-sm px-2">
            <span>Sound Mixer ({activeCount} active)</span>
            <span>Select to edit</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 no-scrollbar mask-linear">
             {THEMES.map(theme => (
               <ThemeCard 
                 key={theme.id} 
                 theme={theme} 
                 isVisualActive={visualThemeId === theme.id}
                 isAudioActive={!!mix[theme.id]?.isPlaying}
                 volume={mix[theme.id]?.volume ?? 0.5}
                 onVisualClick={() => setVisualThemeId(theme.id)}
                 onToggleAudio={() => handleToggleAudio(theme.id)}
                 onVolumeChange={(val) => handleVolumeChange(theme.id, val)}
               />
             ))}
          </div>
        </div>
      </div>

      {/* UI Hidden Overlay */}
      {isUIHidden && (
        <div 
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
          onClick={() => setIsUIHidden(false)}
        >
        </div>
      )}

      {/* Timer Modal */}
      {showTimerModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-white font-semibold">Sleep Timer</h3>
              <button onClick={() => setShowTimerModal(false)} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[15, 30, 45, 60].map(min => (
                <button
                  key={min}
                  onClick={() => setTimer(min)}
                  className={`p-4 rounded-xl border transition-all ${timerDuration === min ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                >
                  {min} min
                </button>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-6">
               <label className="text-sm text-white/60 mb-2 block">Custom (minutes)</label>
               <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Enter minutes..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setTimer(parseInt((e.target as HTMLInputElement).value));
                      }
                    }}
                  />
                  <button 
                     onClick={() => setTimer(null)}
                     className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Stop
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}