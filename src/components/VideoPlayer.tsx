'use client';

import { useEffect, useRef, useState } from 'react';
import type DPlayer from 'dplayer';
import 'dplayer/dist/DPlayer.min.css';

interface VideoPlayerProps {
  initialUrl: string;
  title?: string;
  cover?: string;
  id: string;
  onEnded?: () => void;
}

export default function VideoPlayer({ initialUrl, title, cover, id, onEnded }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<DPlayer | null>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  useEffect(() => {
    // 初始化播放器
    const initializePlayer = () => {
      if (containerRef.current) {
        import('dplayer').then((DPlayerModule) => {
          if (playerRef.current) {
            playerRef.current.destroy(); // 销毁当前播放器实例
          }
          const DPlayer = DPlayerModule.default;
          playerRef.current = new DPlayer({
            container: containerRef.current as HTMLElement,
            video: {
              url: currentUrl,
              type: 'auto',
            },
            title: title,
            theme: '#FADFA3',
            autoplay: false,
            preload: 'auto',
            volume: 0.7,
            playbackSpeed: [0.5, 0.75, 1, 1.25, 1.5, 2],
            hotkey: true,
            logo: '',
            subtitle: {
              url: '',
              type: 'webvtt',
              fontSize: '25px',
              bottom: '10%',
              color: '#fff',
            },
          });
          // 绑定 ended 事件
          playerRef.current.on('ended', () => {
            if (onEnded) {
              onEnded();
            }
          });

          // 延迟3秒后开始播放
          setTimeout(() => {
            playerRef.current?.play();
          }, 5000);
        });
      }
    };

    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentUrl, title, cover, id, onEnded]);


  return (
    <div className="w-screen relative vh-100">
      {/* 仅在 cover 存在时显示封面图片 */}
      {cover && (
        <img src={cover} alt="封面" className="absolute inset-0 w-full h-full object-cover z-0" />
      )}
      <div ref={containerRef} className="w-full h-full z-10"></div>
    </div>
  );
} 