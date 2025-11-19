import React from 'react';
import { ThemeConfig } from '../types';
import { Volume2, VolumeX } from 'lucide-react';

interface Props {
  theme: ThemeConfig;
  isVisualActive: boolean;
  isAudioActive: boolean;
  volume: number;
  onVisualClick: () => void;
  onToggleAudio: () => void;
  onVolumeChange: (val: number) => void;
}

export const ThemeCard: React.FC<Props> = ({ 
  theme, 
  isVisualActive, 
  isAudioActive, 
  volume,
  onVisualClick, 
  onToggleAudio,
  onVolumeChange
}) => {
  const Icon = theme.icon;

  // Handle click: If clicking the card body, set visual. 
  // We'll add a specific button for audio toggle to avoid confusion, or make the icon the toggle.
  
  return (
    <div 
      className={`
        group relative flex flex-col items-center justify-between
        transition-all duration-500 rounded-3xl p-4
        w-28 h-36 md:w-36 md:h-44
        ${isVisualActive 
          ? 'bg-white/20 shadow-xl scale-105 border border-white/40 backdrop-blur-xl' 
          : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20'
        }
      `}
      onClick={onVisualClick}
    >
      {/* Header: Icon and Status */}
      <div className="relative w-full flex flex-col items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAudio();
          }}
          className={`
            p-3 rounded-full transition-all duration-300 shadow-lg z-10
            ${isAudioActive 
              ? 'bg-white text-black scale-110 shadow-white/20' 
              : `${theme.primaryColor} bg-white/10 hover:bg-white/20`
            }
          `}
        >
          <Icon size={24} />
        </button>
        
        <span className={`text-xs md:text-sm font-medium tracking-wide text-center ${isVisualActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
          {theme.name}
        </span>
      </div>

      {/* Volume Control - Only visible if audio is active */}
      <div 
        className={`
          w-full transition-all duration-500 overflow-hidden flex flex-col justify-end
          ${isAudioActive ? 'h-16 opacity-100' : 'h-0 opacity-0'}
        `}
      >
        <div className="flex items-center gap-2 mb-1 px-1" onClick={e => e.stopPropagation()}>
           <Volume2 size={12} className="text-white/60" />
           <input
             type="range"
             min="0"
             max="1"
             step="0.01"
             value={volume}
             onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
             className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
           />
        </div>
      </div>

      {/* Active Glow */}
      {isVisualActive && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}
      
      {/* Visual Indicator for 'Playing' on top right */}
      {isAudioActive && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
      )}
    </div>
  );
};