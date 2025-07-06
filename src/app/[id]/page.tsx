'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import VerticalSlider from '@/components/VerticalSlider';
import UserAvatar from '@/components/UserAvatar';
import SimpleEpisodeList, { SimpleEpisodeListRef } from '@/components/SimpleEpisodeList';

// 定义视频数据类型
interface VideoData {
  id: string;
  title: string;
  displayName: string;
  cover: string;
  episodes: Array<{
    id: string;
    title: string;
    videoUrl: string;
    isLocked: boolean;
  }>;
}

// 定义slider项目类型
interface SliderItem {
  id: string;
  videoUrl: string;
  title: string;
  cover?: string;
  isLocked?: boolean;
}

// 获取视频基本信息和剧集列表
async function fetchVideoData(id: string, user: any): Promise<VideoData | null> {
  try {
    // 获取基本视频信息
    const videoResponse = await fetch(`${BASE_URL}/videos/${id}`);
    if (!videoResponse.ok) {
      throw new Error('获取视频信息失败');
    }
    const videoData = await videoResponse.json();

    // 获取剧集信息
    const episodesResponse = await fetch(`${BASE_URL}/videos/${id}/user-episodes`, {
      headers: user ? { Authorization: `Bearer ${user.token}` } : {},
    });
    
    let episodes = [];
    if (episodesResponse.ok) {
      const episodesData = await episodesResponse.json();
      if (episodesData.success) {
        episodes = episodesData.data.episodes || [];
      }
    }

    // 初始化剧集数据，暂不获取播放地址
    const episodesWithoutUrls = episodes.map((episode: any) => ({
      id: episode.id,
      title: episode.title,
      videoUrl: '', // 初始为空，后续动态获取
      isLocked: episode.isLocked,
    }));

    return {
      id: videoData.data.id || id,
      title: videoData.data.title,
      displayName: videoData.data.displayName,
      cover: videoData.data.cover,
      episodes: episodesWithoutUrls,
    };
  } catch (error) {
    console.error('获取视频数据失败:', error);
    return null;
  }
}

// 获取单个剧集的播放地址
async function fetchEpisodeUrl(videoId: string, episodeId: string): Promise<string> {
  try {
    const episodeResponse = await fetch(`${BASE_URL}/videos/${videoId}/${episodeId}`);
    if (episodeResponse.ok) {
      const episodeData = await episodeResponse.json();
      return episodeData.data.playurl || '';
    }
  } catch (error) {
    console.error(`获取剧集 ${episodeId} 播放地址失败:`, error);
  }
  return '';
}

export default function VideoSliderPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const { user } = useAuth();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [episodesCache, setEpisodesCache] = useState<any[]>([]); // 缓存包含播放地址的剧集
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('');
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);

  // 创建对SimpleEpisodeList的引用
  const simpleEpisodeListRef = useRef<SimpleEpisodeListRef>(null);

  // 处理锁定剧集
  const handleLockedEpisode = (lockedEpisode: any) => {
    // 直接展开选集列表并显示支付选项
    if (simpleEpisodeListRef.current) {
      simpleEpisodeListRef.current.expandAndShowPayment(lockedEpisode.id);
    }
  };

  // 获取当前集数前后两集的播放地址
  const fetchSurroundingEpisodes = async (allEpisodes: any[], currentIndex: number) => {
    const indices = [
      Math.max(0, currentIndex - 1),
      currentIndex,
      Math.min(allEpisodes.length - 1, currentIndex + 1)
    ];
    
    // 去重
    const uniqueIndices = [...new Set(indices)];
    
    // 使用函数式更新确保使用最新的缓存状态
    setEpisodesCache(currentCache => {
      // 获取需要更新播放地址的剧集（跳过locked剧集）
      const episodesToFetch = uniqueIndices.filter(index => {
        const episode = allEpisodes[index];
        // 跳过locked剧集
        if (episode.isLocked) return false;
        
        const existingEpisode = currentCache.find(ep => ep.id === episode.id);
        return !existingEpisode || !existingEpisode.videoUrl;
      });

      if (episodesToFetch.length > 0) {
        // 异步获取播放地址
        Promise.all(
          episodesToFetch.map(async (index) => {
            const episode = allEpisodes[index];
            const videoUrl = await fetchEpisodeUrl(id, episode.id);
            
            // 更新缓存
            setEpisodesCache(prevCache => {
              const updatedCache = [...prevCache];
              const existingIndex = updatedCache.findIndex(ep => ep.id === episode.id);
              if (existingIndex !== -1) {
                updatedCache[existingIndex] = { ...episode, videoUrl };
              } else {
                updatedCache.push({ ...episode, videoUrl });
              }
              return updatedCache;
            });
          })
        ).catch(error => {
          console.error('获取播放地址失败:', error);
        });
      }
      
      return currentCache;
    });
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      
      fetchVideoData(id, user)
        .then(data => {
          if (data) {
            setVideoData(data);
            // 获取所有剧集（包括locked）
            const allEpisodes = data.episodes;
            if (allEpisodes.length > 0) {
              // 找到第一个未锁定的剧集作为初始播放剧集
              const firstUnlockedIndex = allEpisodes.findIndex(episode => !episode.isLocked);
              if (firstUnlockedIndex !== -1) {
                setCurrentEpisodeId(allEpisodes[firstUnlockedIndex].id);
                setCurrentSliderIndex(firstUnlockedIndex);
                // 初始化获取前三集的播放地址
                fetchSurroundingEpisodes(allEpisodes, firstUnlockedIndex);
              } else {
                // 如果所有剧集都锁定，设置第一个剧集为当前
                setCurrentEpisodeId(allEpisodes[0].id);
                setCurrentSliderIndex(0);
                fetchSurroundingEpisodes(allEpisodes, 0);
              }
            }
          } else {
            setError('获取视频数据失败');
          }
        })
        .catch(err => {
          console.error('获取视频数据出错:', err);
          setError('获取视频数据出错');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, user]);

  // 处理当前视频项变化
  const handleItemChange = (index: number) => {
    setCurrentSliderIndex(index);
    
    // 滑动时立即收起选集列表
    if (simpleEpisodeListRef.current) {
      simpleEpisodeListRef.current.collapse();
    }
    
    // 更新当前剧集ID
    if (videoData) {
      const allEpisodes = videoData.episodes;
      if (allEpisodes[index]) {
        setCurrentEpisodeId(allEpisodes[index].id);
        
        // 检查是否为locked剧集
        if (allEpisodes[index].isLocked) {
          // 稍微延迟后触发支付解锁流程，避免UI闪烁
          setTimeout(() => {
            handleLockedEpisode(allEpisodes[index]);
          }, 300);
        } else {
          // 动态获取新的播放地址
          fetchSurroundingEpisodes(allEpisodes, index);
        }
      }
    }
  };

  // 处理剧集选择
  const handleEpisodeSelect = (episodeId: string) => {
    if (videoData) {
      const allEpisodes = videoData.episodes;
      
      const episodeIndex = allEpisodes.findIndex(episode => episode.id === episodeId);
      if (episodeIndex !== -1) {
        setCurrentSliderIndex(episodeIndex);
        setCurrentEpisodeId(episodeId);
        
        // 检查是否为locked剧集
        if (allEpisodes[episodeIndex].isLocked) {
          // 如果是locked剧集，不需要特殊处理，因为用户已经通过SimpleEpisodeList解锁了
          // 只需要动态获取播放地址
          fetchSurroundingEpisodes(allEpisodes, episodeIndex);
        } else {
          // 动态获取新的播放地址
          fetchSurroundingEpisodes(allEpisodes, episodeIndex);
        }
      }
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  // 错误状态
  if (error || !videoData) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">{error || '视频不存在'}</div>
      </div>
    );
  }

  // 所有剧集（包括locked），优先从缓存中获取播放地址
  const allEpisodes = videoData.episodes;

  // 转换为slider项目格式，优先从缓存中获取播放地址
  const sliderItems: SliderItem[] = allEpisodes.map(episode => {
    // 优先从缓存中获取播放地址
    const cachedEpisode = episodesCache.find(ep => ep.id === episode.id);
    const videoUrl = cachedEpisode?.videoUrl || episode.videoUrl || '';
    
    return {
      id: episode.id,
      videoUrl: episode.isLocked ? '' : videoUrl, // locked剧集不显示播放地址
      title: `${videoData.displayName} - ${episode.title}`,
      cover: videoData.cover,
      isLocked: episode.isLocked,
    };
  });

  // 如果没有剧集
  if (sliderItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">暂无剧集</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* 垂直滑动播放器 */}
      <VerticalSlider
        items={sliderItems}
        initialIndex={currentSliderIndex}
        onItemChange={handleItemChange}
      />
      
      {/* 用户头像 */}
      <UserAvatar />
      
      {/* 视频标题 */}
      <div className="absolute top-4 left-4 right-16 text-white text-xl font-semibold z-20">
        {videoData.displayName}
      </div>

      {/* 选集列表组件 */}
      <SimpleEpisodeList 
        ref={simpleEpisodeListRef}
        videoId={id}
        currentEpisodeId={currentEpisodeId}
        onEpisodeSelect={handleEpisodeSelect}
      />
    </div>
  );
} 