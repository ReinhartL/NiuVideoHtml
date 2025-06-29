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

  const handlers = useSwipeable({
    onSwipedUp: handleSwipeUp,
    onSwipedDown: handleSwipeDown,
    delta: 50, // 最小滑动距离
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
  });

  return (
    <>
      {/* 滑动区域 */}
      <div
        {...handlers}
        className="fixed inset-0 z-10 pointer-events-auto"
        style={{ touchAction: 'pan-y' }}
      />
    </>
  );
} 