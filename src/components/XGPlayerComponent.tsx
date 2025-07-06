'use client';

import { useEffect, useRef, useState } from 'react';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';

interface XGPlayerProps {
  url: string;
  title?: string;
  cover?: string;
  id: string;
  autoplay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export default function XGPlayerComponent({
  url,
  title,
  cover,
  id,
  autoplay = false,
  onEnded,
  className = ''
}: XGPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    // 清理之前的播放器实例
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // 创建新的播放器实例
    try {
      const playerId = `xgplayer-${id}-${Date.now()}`;
      containerRef.current.id = playerId;
      
      const player = new Player({
        id: playerId,
        url: url,
        autoplay: autoplay,
        autoplayMuted: false, // 不静音
        volume: 0.7,
        pip: false, // 禁用画中画
        download: false, // 禁用下载
        screenShot: false, // 禁用截图
        playsinline: true, // iOS内联播放
        fluid: true, // 流式布局
        fitVideoSize: 'fixWidth',
        rotate: true, // 允许旋转
        lang: 'zh-cn',
        controls: true, // 启用完整控制条
        controlsList: ['play', 'progress', 'time', 'volume'], // 指定控制元素
        allowSeekPlaying: true, // 允许播放时拖拽进度条
        enableVideoDblclick: false, // 禁用双击全屏，使用自定义处理
        enableVideoClick: false, // 禁用内置单击播放/暂停，使用自定义处理
        css: [
          {
            name: 'custom-player-style',
            style: `
              #${playerId} {
                width: 100% !important;
                height: 100% !important;
                background: #000 !important;
                position: relative !important;
              }
              #${playerId} .xgplayer {
                width: 100% !important;
                height: 100% !important;
                background: #000 !important;
                position: relative !important;
              }
              #${playerId} .xgplayer-video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
              #${playerId} .xgplayer-controls {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                background: linear-gradient(transparent, rgba(0,0,0,0.7)) !important;
                z-index: 100 !important;
              }
              #${playerId} .xgplayer-start {
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 200 !important;
              }
            `
          }
        ]
      });

      playerRef.current = player;

      // 绑定事件
            player.on('ready', () => {
        setIsReady(true);
        
        // 添加手动点击事件处理
        const videoElement = containerRef.current?.querySelector('video');
        if (videoElement) {
          const handleVideoClick = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            
            // 获取当前播放状态
            const isPlaying = !videoElement.paused;
            
                          try {
                if (isPlaying) {
                  // 暂停播放
                  player.pause();
                  
                  // 暂停时移除inactive状态，显示控制条
                  const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
                  if (xgplayerContainer) {
                    xgplayerContainer.classList.remove('xgplayer-inactive');
                  }
                  
                } else {
                  // 开始播放
                  player.play();
                  
                  // 播放后延迟添加inactive状态
                  setTimeout(() => {
                    const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
                    if (xgplayerContainer && !videoElement.paused) {
                      xgplayerContainer.classList.add('xgplayer-inactive');
                    }
                  }, 3000);
                }
              } catch (error) {
                // 视频控制错误
              }
          };
          
          videoElement.addEventListener('click', handleVideoClick);
          
          // 确保视频可以播放
          videoElement.addEventListener('canplay', () => {
            // 视频可以播放
          });
          
          videoElement.addEventListener('loadeddata', () => {
            // 视频已加载数据
          });
          
          // 清理函数中移除事件监听器
          return () => {
            videoElement.removeEventListener('click', handleVideoClick);
          };
        }
      });

      player.on('play', () => {
        // XGPlayer播放事件
      });

      player.on('pause', () => {
        // XGPlayer暂停事件
      });

      // 监听原生video元素的播放状态变化
      const videoElement = containerRef.current?.querySelector('video');
      if (videoElement) {
        videoElement.addEventListener('play', () => {
          // 确保XGPlayer容器的CSS类正确
          const playerContainer = containerRef.current?.querySelector('.xgplayer');
          if (playerContainer) {
            playerContainer.classList.remove('xgplayer-paused');
          }
        });
        
        videoElement.addEventListener('pause', () => {
          // 确保XGPlayer容器的CSS类正确
          const playerContainer = containerRef.current?.querySelector('.xgplayer');
          if (playerContainer) {
            playerContainer.classList.add('xgplayer-paused');
          }
        });
        
        videoElement.addEventListener('playing', () => {
          // 确保XGPlayer容器的CSS类正确
          const playerContainer = containerRef.current?.querySelector('.xgplayer');
          if (playerContainer) {
            playerContainer.classList.remove('xgplayer-paused');
          }
        });
        
        videoElement.addEventListener('waiting', () => {
          // 视频等待事件
        });
      }

      player.on('ended', () => {
        onEnded?.();
      });

      player.on('error', (error) => {
        // XGPlayer错误
      });

      player.on('loadstart', () => {
        // XGPlayer开始加载
      });

    } catch (error) {
      // XGPlayer初始化错误
    }

    // 清理函数
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          // XGPlayer销毁错误
        }
        playerRef.current = null;
      }
      setIsReady(false);
    };
  }, [url, cover, autoplay, onEnded]);

  // 暴露播放器控制方法
  const play = () => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.play();
      } catch (error) {
        // XGPlayer播放错误
      }
    }
  };

  const pause = () => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.pause();
      } catch (error) {
        // XGPlayer暂停错误
      }
    }
  };

  const toggle = () => {
    if (playerRef.current && isReady && containerRef.current) {
      const player = playerRef.current;
      try {
        const videoElement = containerRef.current.querySelector('video');
        if (videoElement) {
          const isPlaying = !videoElement.paused;
          
          if (isPlaying) {
            // 确保暂停
            videoElement.pause();
            player.pause();
          } else {
            // 确保播放
            const playPromise = videoElement.play();
            if (playPromise) {
              playPromise.catch(err => {
                player.play();
              });
            }
            player.play();
          }
        }
      } catch (error) {
        // XGPlayer切换错误
      }
    }
  };

  // 将控制方法暴露给父组件
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).xgplayerInstance = {
        play: () => {
          if (playerRef.current && isReady) {
            const videoElement = containerRef.current?.querySelector('video');
            if (videoElement) {
              // 优先使用XGPlayer API以保持内部状态管理
              try {
                playerRef.current.play();
                
                // 延迟后手动触发inactive状态管理
                setTimeout(() => {
                  const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
                  if (xgplayerContainer && !videoElement.paused) {
                    // 模拟用户交互后的inactive状态
                    xgplayerContainer.classList.add('xgplayer-inactive');
                  }
                }, 3000);
                
              } catch (error) {
                // 备用方法：直接操作video元素
                videoElement.play().catch(err => {
                  // 视频播放失败
                });
              }
            }
          }
        },
        pause: () => {
          if (playerRef.current && isReady) {
            const videoElement = containerRef.current?.querySelector('video');
            if (videoElement) {
              try {
                playerRef.current.pause();
                
                // 暂停时移除inactive状态，显示控制条
                const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
                if (xgplayerContainer) {
                  xgplayerContainer.classList.remove('xgplayer-inactive');
                }
                
              } catch (error) {
                videoElement.pause();
              }
            }
          }
        },
        toggle,
        player: playerRef.current
      };
    }
  }, [isReady]);

  // 添加容器点击处理
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (playerRef.current && isReady && containerRef.current) {
      const player = playerRef.current;
      const videoElement = containerRef.current.querySelector('video');
      
      if (videoElement) {
        const isPlaying = !videoElement.paused;
        
        if (isPlaying) {
          player.pause();
          
          // 暂停时移除inactive状态
          const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
          if (xgplayerContainer) {
            xgplayerContainer.classList.remove('xgplayer-inactive');
          }
          
        } else {
          player.play();
          
          // 播放后延迟添加inactive状态
          setTimeout(() => {
            const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
            if (xgplayerContainer && !videoElement.paused) {
              xgplayerContainer.classList.add('xgplayer-inactive');
            }
          }, 3000);
        }
      }
    }
  };

  // 添加触摸事件处理
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (playerRef.current && isReady && containerRef.current) {
      const player = playerRef.current;
      const videoElement = containerRef.current.querySelector('video');
      
      if (videoElement) {
        const isPlaying = !videoElement.paused;
        
        if (isPlaying) {
          player.pause();
          
          // 暂停时移除inactive状态
          const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
          if (xgplayerContainer) {
            xgplayerContainer.classList.remove('xgplayer-inactive');
          }
          
        } else {
          player.play();
          
          // 播放后延迟添加inactive状态
          setTimeout(() => {
            const xgplayerContainer = containerRef.current?.querySelector('.xgplayer');
            if (xgplayerContainer && !videoElement.paused) {
              xgplayerContainer.classList.add('xgplayer-inactive');
            }
          }, 3000);
        }
      }
    }
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full relative cursor-pointer"
        data-player-id={id}
        onClick={handleContainerClick}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#000'
        }}
      />
    </div>
  );
} 