declare module 'react-slick';

declare module 'xgplayer' {
  interface XGPlayerConfig {
    id: string | HTMLElement;
    url: string;
    poster?: string;
    autoplay?: boolean;
    autoplayMuted?: boolean;
    volume?: number;
    pip?: boolean;
    download?: boolean;
    screenShot?: boolean;
    playsinline?: boolean;
    fluid?: boolean;
    fitVideoSize?: 'fixWidth' | 'fixHeight' | 'fixed';
    rotate?: boolean;
    lang?: string;
    controls?: boolean | {
      mode?: string;
    };
    controlsList?: string[];
    allowSeekPlaying?: boolean;
    enableVideoDblclick?: boolean;
    enableVideoClick?: boolean;
    css?: Array<{
      name: string;
      style: string;
    }>;
  }

  class Player {
    constructor(config: XGPlayerConfig);
    play(): void;
    pause(): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    readonly paused: boolean;
    readonly currentTime: number;
    readonly duration: number;
  }

  export default Player;
}
