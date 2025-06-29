'use client';

import { useEffect, useRef, useState } from 'react';
import type DPlayer from 'dplayer';
import 'dplayer/dist/DPlayer.min.css';
import SimpleGestureHandler from './SimpleGestureHandler';

interface Episode {
  id: string;
  title: string;
  isLocked: boolean;
}

interface VideoPlayerProps {
  initialUrl: string;
  title?: string;
  cover?: string;
  id: string;
  onEnded?: () => void;
  // 手势相关props
  episodes?: Episode[];
  currentEpisodeId?: string;
  onEpisodeChange?: (episodeId: string) => void;
  onLockedEpisodeAccess?: (episode: Episode) => void;
}

export default function VideoPlayer({ 
  initialUrl, 
  title, 
  cover, 
  id, 
  onEnded,
  episodes = [],
  currentEpisodeId,
  onEpisodeChange,
  onLockedEpisodeAccess
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<DPlayer | null>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [showPlayButton, setShowPlayButton] = useState(false);

  // 监听 initialUrl 变化，更新 currentUrl
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrl) {
      setCurrentUrl(initialUrl);
    }
  }, [initialUrl, currentUrl]);

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
            autoplay: true, // 启用自动播放
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
          
          // 绑定播放器事件
          playerRef.current.on('ended', () => {
            if (onEnded) {
              onEnded();
            }
          });

          // 监听播放开始事件，隐藏播放按钮
          playerRef.current.on('play', () => {
            setShowPlayButton(false);
          });

          // 监听播放暂停事件
          playerRef.current.on('pause', () => {
            // 不立即显示播放按钮，等待用户操作
          });

          // 重置播放按钮状态
          setShowPlayButton(false);

          // 绑定加载完成事件
          playerRef.current.on('loadeddata', () => {
            const hasUserInteracted = sessionStorage.getItem('userInteracted') === 'true';
            
            setTimeout(() => {
              try {
                if (playerRef.current) {
                  playerRef.current.play();
                  console.log('尝试自动播放');
                  setShowPlayButton(false);
                }
              } catch (error) {
                console.log('自动播放被阻止');
                // 如果用户之前没有交互过，显示播放按钮
                if (!hasUserInteracted) {
                  setShowPlayButton(true);
                } else {
                  // 用户已经交互过，短暂显示播放按钮
                  setShowPlayButton(true);
                  setTimeout(() => setShowPlayButton(false), 3000);
                }
              }
            }, hasUserInteracted ? 100 : 500); // 如果用户已交互，减少延迟
          });
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


  // 手动播放函数
  const handleManualPlay = () => {
    try {
      if (playerRef.current) {
        playerRef.current.play();
        setShowPlayButton(false);
        // 标记用户已经交互过，后续视频切换可能能自动播放
        sessionStorage.setItem('userInteracted', 'true');
      }
    } catch (error) {
      console.log('手动播放失败:', error);
    }
  };

  const playerContent = (
    <>
      {/* 仅在 cover 存在时显示封面图片 */}
      {cover && (
        <img src={cover} alt="封面" className="absolute inset-0 w-full h-full object-cover z-0" />
      )}
      <div ref={containerRef} className="w-full h-full z-10"></div>
      
      {/* 手动播放按钮 */}
      {showPlayButton && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20 bg-black/30"
          onClick={handleManualPlay}
        >
          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-l-[16px] border-l-black border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="w-screen relative vh-100">
      {episodes.length > 0 && currentEpisodeId ? (
        <SimpleGestureHandler
          episodes={episodes}
          currentEpisodeId={currentEpisodeId}
          onEpisodeChange={onEpisodeChange}
          onLockedEpisodeAccess={onLockedEpisodeAccess}
        >
          {playerContent}
        </SimpleGestureHandler>
      ) : (
        playerContent
      )}
      

    </div>
  );
} 