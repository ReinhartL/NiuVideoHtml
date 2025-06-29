'use client';

import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Episode {
  id: string;
  title: string;
  isLocked: boolean;
}

interface VerticalSliderProps {
  episodes: Episode[];
  currentEpisodeId: string;
  videoId: string;
  onEpisodeChange?: (episodeId: string) => void;
  onLockedEpisodeAccess?: (episode: Episode) => void; // 当尝试访问锁定剧集时的回调
}

export default function VerticalSlider({ 
  episodes, 
  currentEpisodeId, 
  videoId, 
  onEpisodeChange,
  onLockedEpisodeAccess
}: VerticalSliderProps) {
  const router = useRouter();
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  
  // 获取当前剧集的索引
  const currentIndex = episodes.findIndex(ep => ep.id === currentEpisodeId);
  
  // 获取上一集和下一集
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < episodes.length - 1;
  const previousEpisode = hasPrevious ? episodes[currentIndex - 1] : null;
  const nextEpisode = hasNext ? episodes[currentIndex + 1] : null;

  // 处理滑动到下一集
  const handleSwipeUp = () => {
    if (hasNext && nextEpisode) {
      // 检查下一集是否锁定
      if (nextEpisode.isLocked) {
        // 如果锁定，触发解锁选项
        onLockedEpisodeAccess?.(nextEpisode);
      } else {
        // 如果未锁定，正常跳转
        router.push(`/${videoId}/${nextEpisode.id}`);
        onEpisodeChange?.(nextEpisode.id);
      }
    }
  };

  // 处理滑动到上一集
  const handleSwipeDown = () => {
    if (hasPrevious && previousEpisode) {
      // 检查上一集是否锁定
      if (previousEpisode.isLocked) {
        // 如果锁定，触发解锁选项
        onLockedEpisodeAccess?.(previousEpisode);
      } else {
        // 如果未锁定，正常跳转
        router.push(`/${videoId}/${previousEpisode.id}`);
        onEpisodeChange?.(previousEpisode.id);
      }
    }
  };

  // 原生触摸事件处理（备用方案）
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // 垂直滑动检测
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        // 向上滑动 - 下一集
        handleSwipeUp();
      } else {
        // 向下滑动 - 上一集
        handleSwipeDown();
      }
    }
    
    setTouchStart(null);
  };

  const handlers = useSwipeable({
    onSwipedUp: handleSwipeUp,
    onSwipedDown: handleSwipeDown,
    delta: 30, // 降低最小滑动距离，提高敏感度
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true, // 同时支持鼠标操作
    touchEventOptions: { passive: false }, // 关闭passive模式，允许preventDefault
    rotationAngle: 0,
  });

  return (
    <>
      {/* 滑动区域 */}
      <div
        {...handlers}
        className="fixed inset-0 z-10 pointer-events-auto touch-area"
        style={{ 
          touchAction: 'pan-y',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          msTouchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => {
          // 允许垂直滚动，阻止水平滚动
          const touch = e.touches[0];
          if (touchStart) {
            const deltaX = Math.abs(touch.clientX - touchStart.x);
            const deltaY = Math.abs(touch.clientY - touchStart.y);
            // 如果主要是水平移动，阻止默认行为
            if (deltaX > deltaY) {
              e.preventDefault();
            }
          }
        }}
      />
    </>
  );
} 