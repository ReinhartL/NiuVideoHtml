'use client';

import { useRef, useEffect, useCallback } from 'react';

interface Episode {
  id: string;
  title: string;
  isLocked: boolean;
}

interface SimpleGestureHandlerProps {
  episodes: Episode[];
  currentEpisodeId: string;
  onEpisodeChange?: (episodeId: string) => void;
  onLockedEpisodeAccess?: (episode: Episode) => void;
  children: React.ReactNode;
}

export default function SimpleGestureHandler({
  episodes,
  currentEpisodeId,
  onEpisodeChange,
  onLockedEpisodeAccess,
  children
}: SimpleGestureHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  // 获取当前剧集的索引
  const currentIndex = episodes.findIndex(ep => ep.id === currentEpisodeId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < episodes.length - 1;
  const previousEpisode = hasPrevious ? episodes[currentIndex - 1] : null;
  const nextEpisode = hasNext ? episodes[currentIndex + 1] : null;

  // 处理切换到下一集
  const handleSwipeToNext = useCallback(() => {
    if (hasNext && nextEpisode) {
      if (nextEpisode.isLocked) {
        onLockedEpisodeAccess?.(nextEpisode);
      } else {
        onEpisodeChange?.(nextEpisode.id);
      }
    }
  }, [hasNext, nextEpisode, onEpisodeChange, onLockedEpisodeAccess]);

  // 处理切换到上一集
  const handleSwipeToPrevious = useCallback(() => {
    if (hasPrevious && previousEpisode) {
      if (previousEpisode.isLocked) {
        onLockedEpisodeAccess?.(previousEpisode);
      } else {
        onEpisodeChange?.(previousEpisode.id);
      }
    }
  }, [hasPrevious, previousEpisode, onEpisodeChange, onLockedEpisodeAccess]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        const deltaY = endY - startY.current;
        const duration = endTime - startTime.current;

        // 检查是否是有效的垂直滑动
        if (Math.abs(deltaY) > 50 && duration < 500) {
          if (deltaY < 0) {
            // 向上滑动 - 下一集
            e.preventDefault();
            e.stopPropagation();
            handleSwipeToNext();
          } else {
            // 向下滑动 - 上一集
            e.preventDefault();
            e.stopPropagation();
            handleSwipeToPrevious();
          }
        }
      }
    };

    // 添加事件监听器
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSwipeToNext, handleSwipeToPrevious]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        touchAction: 'pan-x', // 允许水平滑动，阻止垂直滑动的系统行为
      }}
    >
      {children}
    </div>
  );
} 