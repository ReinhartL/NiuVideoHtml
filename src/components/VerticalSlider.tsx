'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import XGPlayerComponent from './XGPlayerComponent';

interface SliderItem {
  id: string;
  videoUrl: string;
  title: string;
  cover?: string;
}

interface VerticalSliderProps {
  items: SliderItem[];
  initialIndex?: number;
  onItemChange?: (index: number) => void;
}

export default function VerticalSlider({ 
  items, 
  initialIndex = 0, 
  onItemChange 
}: VerticalSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 保留用于视觉反馈
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // 跟踪用户是否已经交互
  const [showFirstTimeUI, setShowFirstTimeUI] = useState(true); // 跟踪是否显示首次进入UI
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const translateY = useRef<number>(0);

  // 监听 initialIndex 的变化，同步更新 currentIndex
  useEffect(() => {
    if (initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, currentIndex]);

  // 获取当前显示的三个项目
  const getVisibleItems = useCallback(() => {
    const result = [];
    for (let i = -1; i <= 1; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < items.length) {
        result.push({
          ...items[index],
          position: i,
          key: `${index}-${items[index].id}`,
        });
      }
    }
    return result;
  }, [currentIndex, items]);

  const visibleItems = getVisibleItems();



  // 控制播放状态
  const updatePlaybackState = useCallback(() => {
    visibleItems.forEach((item) => {
      const playerContainer = document.querySelector(`[data-player-id="${item.id}"]`);
      if (playerContainer) {
        const xgplayerInstance = (playerContainer as any).xgplayerInstance;
        if (xgplayerInstance && xgplayerInstance.player) {
          if (item.position === 0) {
            // 当前视频：如果用户已经交互过，则自动播放
            if (hasUserInteracted) {
              try {
                // 使用原生video元素和XGPlayer双重保险
                const videoElement = playerContainer.querySelector('video');
                if (videoElement) {
                  // 确保视频已加载
                  if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
                    // 优先使用XGPlayer API，这样可以正确触发内部状态管理
                    xgplayerInstance.play();
                    
                    // 延迟后手动触发inactive状态
                    setTimeout(() => {
                      const xgplayerContainer = playerContainer.querySelector('.xgplayer');
                      if (xgplayerContainer && !xgplayerContainer.classList.contains('xgplayer-inactive')) {
                        xgplayerContainer.classList.add('xgplayer-inactive');
                      }
                    }, 3000);
                  } else {
                    // 等待视频加载
                    const onCanPlay = () => {
                      xgplayerInstance.play();
                      
                      // 延迟后手动触发inactive状态
                      setTimeout(() => {
                        const xgplayerContainer = playerContainer.querySelector('.xgplayer');
                        if (xgplayerContainer && !xgplayerContainer.classList.contains('xgplayer-inactive')) {
                          xgplayerContainer.classList.add('xgplayer-inactive');
                        }
                      }, 3000);
                      
                      videoElement.removeEventListener('canplay', onCanPlay);
                    };
                    videoElement.addEventListener('canplay', onCanPlay);
                  }
                }
              } catch (error) {
                // 自动播放失败
                console.error('自动播放失败:', error);
              }
            }
          } else {
            // 非当前视频：暂停
            try {
              xgplayerInstance.pause();
              const videoElement = playerContainer.querySelector('video');
              if (videoElement) {
                videoElement.pause();
              }
            } catch (error) {
              // 暂停失败
              console.error('暂停失败:', error);
            }
          }
        }
      }
    });
  }, [visibleItems, hasUserInteracted]);

  // 处理滑动到下一项
  const handleSwipeToNext = useCallback(() => {
    if (currentIndex < items.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setScrollProgress(0); // 重置滚动进度
      // 不自动播放，保持暂停状态
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onItemChange?.(newIndex);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentIndex, items.length, isTransitioning, onItemChange]);

  // 处理滑动到上一项
  const handleSwipeToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setScrollProgress(0); // 重置滚动进度
      // 不自动播放，保持暂停状态
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onItemChange?.(newIndex);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentIndex, isTransitioning, onItemChange]);

  // 处理触摸事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
        
        // 记录用户交互
        if (!hasUserInteracted) {
          setHasUserInteracted(true);
          setShowFirstTimeUI(false);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isTransitioning) {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY.current;
        translateY.current = deltaY;
        
        // 只有在滑动距离大于最小阈值时才处理
        if (Math.abs(deltaY) > 20) {
          // 计算滚动进度 (0-1)
          const progress = Math.abs(deltaY) / (window.innerHeight * 0.5);
          setScrollProgress(Math.min(progress, 1));
          
          // 实时更新视觉反馈
          const transform = `translateY(${deltaY * 0.5}px)`;
          container.style.transform = transform;
          
          // 阻止默认滚动行为，但不阻止点击
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        const deltaY = endY - startY.current;
        const duration = endTime - startTime.current;

        // 重置容器变换
        container.style.transform = 'translateY(0)';

        // 区分点击和滑动：短时间且小距离的是点击
        const isClick = Math.abs(deltaY) < 20 && duration < 300;
        
        if (isClick) {
          // 这是一个点击事件，不阻止它
          setScrollProgress(0);
          
          // 记录用户交互
          if (!hasUserInteracted) {
            setHasUserInteracted(true);
            setShowFirstTimeUI(false);
          }
          
          // 不要阻止事件传播，让播放器处理点击
          return;
        }

        // 检查是否是有效的垂直滑动
        if (Math.abs(deltaY) > 80 && duration < 500) {
          // 只有在明确是滑动时才阻止事件
          e.preventDefault();
          e.stopPropagation();
          
          // 记录用户交互
          if (!hasUserInteracted) {
            setHasUserInteracted(true);
          }
          
          if (deltaY < 0) {
            // 向上滑动 - 下一项
            handleSwipeToNext();
          } else {
            // 向下滑动 - 上一项
            handleSwipeToPrevious();
          }
        } else {
          // 如果不是有效滑动，重置滚动进度
          setScrollProgress(0);
        }
      }
    };

    // 处理鼠标点击（桌面端）
    const handleMouseClick = (e: MouseEvent) => {
      // 记录用户交互
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        setShowFirstTimeUI(false);
      }
    };

    // 添加事件监听器
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('click', handleMouseClick, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('click', handleMouseClick);
    };
  }, [handleSwipeToNext, handleSwipeToPrevious, isTransitioning, hasUserInteracted]);

  // 监听视频切换，更新播放状态
  useEffect(() => {
    if (!isTransitioning) {
      // 延迟执行，确保XGPlayer完全初始化
      const timer = setTimeout(() => {
        updatePlaybackState();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isTransitioning, updatePlaybackState]);

  // 监听用户交互状态变化，立即更新播放状态
  useEffect(() => {
    if (hasUserInteracted) {
      // 用户交互后立即更新播放状态
      const timer = setTimeout(() => {
        updatePlaybackState();
        
        // 额外的检查：确保当前视频确实在播放
        setTimeout(() => {
          const currentItem = visibleItems.find(item => item.position === 0);
          if (currentItem) {
            const playerContainer = document.querySelector(`[data-player-id="${currentItem.id}"]`);
            if (playerContainer) {
              const videoElement = playerContainer.querySelector('video');
              if (videoElement && videoElement.paused) {
                videoElement.play().catch(err => {
                  // 重试播放失败
                  console.error('重试播放失败:', err);
                });
              }
            }
          }
        }, 500);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [hasUserInteracted, updatePlaybackState, visibleItems]);

  // 页面加载时确保所有视频都是暂停状态
  useEffect(() => {
    const timer = setTimeout(() => {
      // 仅暂停非当前视频，不自动播放任何视频
      visibleItems.forEach((item) => {
        const playerContainer = document.querySelector(`[data-player-id="${item.id}"]`);
        if (playerContainer) {
          const xgplayerInstance = (playerContainer as any).xgplayerInstance;
          if (xgplayerInstance && item.position !== 0) {
            xgplayerInstance.pause();
          }
        }
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [items.length, visibleItems]);

  // 处理键盘事件（桌面端支持）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // 记录用户交互
        if (!hasUserInteracted) {
          setHasUserInteracted(true);
          setShowFirstTimeUI(false);
        }
        
        handleSwipeToNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        
        // 记录用户交互
        if (!hasUserInteracted) {
          setHasUserInteracted(true);
          setShowFirstTimeUI(false);
        }
        
        handleSwipeToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipeToNext, handleSwipeToPrevious, hasUserInteracted]);

  // 处理首次播放按钮点击
  const handleFirstPlay = () => {
    setShowFirstTimeUI(false);
    setHasUserInteracted(true);
    
    // 立即开始播放当前视频
    const currentItem = visibleItems.find(item => item.position === 0);
    if (currentItem) {
      const playerContainer = document.querySelector(`[data-player-id="${currentItem.id}"]`);
      if (playerContainer) {
        const xgplayerInstance = (playerContainer as any).xgplayerInstance;
        if (xgplayerInstance) {
          xgplayerInstance.play();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 播放按钮动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pause-animation-1d1d9106 {
            0% {
              opacity: 0;
              transform: scale(2);
            }
            100% {
              transform: scale(1.2);
              opacity: 0.5;
            }
          }
          
          .play-button-animated {
            animation: pause-animation-1d1d9106 0.2s linear;
          }
        `
      }} />
      
      <div
        ref={containerRef}
        className="relative w-full h-full transition-transform duration-300"
        style={{
          touchAction: 'pan-x',
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.key}
            className={`absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-300 ${
              isTransitioning ? 'pointer-events-none' : ''
            }`}
            style={{
              transform: `translateY(${item.position * 100}%)`,
              zIndex: item.position === 0 ? 10 : 1,
            }}
          >
            <div className="relative w-full h-full">
              <XGPlayerComponent
                url={item.videoUrl}
                title={item.title}
                cover={item.cover}
                id={item.id}
                autoplay={false}

              />
              {/* 非当前视频的遮罩 */}
              {item.position !== 0 && (
                <div className="absolute inset-0 bg-black/30 z-20"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 首次进入时的cover和播放按钮 */}
      {showFirstTimeUI && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
          {/* 当前视频的cover */}
          {visibleItems.find(item => item.position === 0)?.cover && (
            <img 
              src={visibleItems.find(item => item.position === 0)?.cover} 
              alt="视频封面"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* 播放按钮 */}
          <div 
            className="relative z-40 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 play-button-animated"
            onClick={handleFirstPlay}
            style={{
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {/* 使用提供的SVG播放图标 */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              aria-hidden="true" 
              role="img" 
              className="text-white/40" 
              width="64" 
              height="64" 
              viewBox="0 0 28 28"
            >
              <path 
                fill="currentColor" 
                d="M10.138 3.382C8.304 2.31 6 3.632 6 5.756v16.489c0 2.123 2.304 3.445 4.138 2.374l14.697-8.59c1.552-.907 1.552-3.15 0-4.057z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
} 