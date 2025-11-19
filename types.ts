export enum NoiseType {
  WHITE = 'WHITE',
  PINK = 'PINK',
  BROWN = 'BROWN',
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  primaryColor: string; // Hex or Tailwind class
  secondaryColor: string;
  textColor: string;
  bgGradient: string;
  noiseType: NoiseType;
  backgroundImageKeyword: string; // For picsum
  particleType: 'rain' | 'fire' | 'snow' | 'fireflies' | 'waves';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface SoundState {
  isPlaying: boolean;
  volume: number;
}

export interface SoundMix {
  [themeId: string]: SoundState;
}