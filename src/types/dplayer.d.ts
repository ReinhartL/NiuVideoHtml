declare module 'dplayer' {
  interface DPlayerOptions {
    container: HTMLElement;
    video: {
      url: string;
      type?: string;
      cover?: string;
    };
    title?: string;
    theme?: string;
    autoplay?: boolean;
    preload?: 'auto' | 'metadata' | 'none';
    volume?: number;
    playbackSpeed?: number[];
    hotkey?: boolean;
    logo?: string;
    subtitle?: {
      url: string;
      type: string;
      fontSize: string;
      bottom: string;
      color: string;
    };
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions);
    destroy(): void;
    play(): void;
    pause(): void;
    on(event: string, callback: () => void): void;
    off(event: string, callback?: () => void): void;
  }
} 