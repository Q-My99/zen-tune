import { NoiseType } from '../types';

interface SoundInstance {
  source: AudioBufferSourceNode;
  gain: GainNode;
  nodes: AudioNode[]; // Keep track of all nodes to disconnect them properly
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  // Map themeId -> SoundInstance
  private instances: Map<string, SoundInstance> = new Map();
  
  // Track intended state to handle context suspension/resumption
  private activeThemes: Set<string> = new Set();

  constructor() {}

  private initContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 1.0;
    }
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds loop
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === NoiseType.WHITE) {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === NoiseType.PINK) {
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168981;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; 
        b6 = white * 0.115926;
      }
    } else if (type === NoiseType.BROWN) {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5; 
      }
    }

    return buffer;
  }

  public async playSound(themeId: string, type: NoiseType, volume: number) {
    this.initContext();
    if (!this.audioContext || !this.masterGain) return;

    // Resume context if needed
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // If already playing, just update volume
    if (this.instances.has(themeId)) {
      this.setVolume(themeId, volume);
      return;
    }

    const nodes: AudioNode[] = [];
    const source = this.audioContext.createBufferSource();
    source.buffer = this.createNoiseBuffer(type);
    source.loop = true;
    nodes.push(source);

    const gain = this.audioContext.createGain();
    gain.gain.value = volume;
    nodes.push(gain);

    // Chain construction based on theme effects
    let lastNode: AudioNode = source;

    // EFFECT: FOREST (Low Pass to simulate wind through trees)
    if (themeId === 'forest') {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      lastNode.connect(filter);
      lastNode = filter;
      nodes.push(filter);
    }
    // EFFECT: FIRE (High Pass to simulate crackle/hiss over brown noise)
    else if (themeId === 'fire') {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 150;
      lastNode.connect(filter);
      lastNode = filter;
      nodes.push(filter);
    }

    // Connect to volume gain
    lastNode.connect(gain);

    // EFFECT: OCEAN (Amplitude Modulation for waves)
    if (themeId === 'ocean') {
      const lfo = this.audioContext.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.15; // Slow wave cycle
      
      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = 0.5; // Modulation depth
      
      // We need to modulate the main gain node.
      // Standard Gain connection: (1 + LFO) * volume? 
      // Simplification: Connect LFO to gain.gain
      // Base gain is 'volume', we oscillate around it.
      // Actually, better to put a second gain node for modulation to avoid complex math.
      const modGain = this.audioContext.createGain();
      modGain.gain.value = 1.0; 
      
      lfo.connect(lfoGain);
      lfoGain.connect(modGain.gain);
      
      lfo.start();
      gain.connect(modGain);
      
      nodes.push(lfo, lfoGain, modGain);
      modGain.connect(this.masterGain);
    } else {
      // Standard connection
      gain.connect(this.masterGain);
    }

    source.start();
    this.instances.set(themeId, { source, gain, nodes });
    this.activeThemes.add(themeId);
  }

  public stopSound(themeId: string) {
    const instance = this.instances.get(themeId);
    if (instance) {
      // Ramp down for smooth stop
      if (this.audioContext) {
         instance.gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
      }
      
      // Stop and disconnect after short delay
      setTimeout(() => {
        instance.source.stop();
        instance.nodes.forEach(node => node.disconnect());
        this.instances.delete(themeId);
      }, 200);
    }
    this.activeThemes.delete(themeId);
  }

  public setVolume(themeId: string, volume: number) {
    const instance = this.instances.get(themeId);
    if (instance && this.audioContext) {
      instance.gain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain && this.audioContext) {
       this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
  }

  public stopAll() {
    this.instances.forEach((_, id) => this.stopSound(id));
    this.activeThemes.clear();
  }

  public async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const audioService = new AudioService();