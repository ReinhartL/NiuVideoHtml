'use client';

import VideoPlayer from '@/components/VideoPlayer';
import UserAvatar from '@/components/UserAvatar';
import EpisodeList from '@/components/EpisodeList';
import VerticalSlider from '@/components/VerticalSlider';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import axios from 'axios';

// Define the type for an episode
export type Episode = {
  id: string;
  title: string;
  isLocked: boolean; // Add isLocked property
};

// Define the type for video data
type VideoData = {
  title: string;
  displayName: string;
  address: string;
  cover: string;
  freeEpisodes: number; // 假设 freeEpisodes 是一个数字，表示免费剧集的数量
};

// Function to fetch video data from the API
async function fetchVideoData(id: string, ep: string): Promise<VideoData> {
  try {
    // 获取视频信息
    const videoResponse = await fetch(`${BASE_URL}/videos/${id}`);
    if (!videoResponse.ok) {
      throw new Error('获取视频信息失败');
    }
    const videoData = await videoResponse.json();

    // 获取剧集地址
    const episodeResponse = await fetch(`${BASE_URL}/videos/${id}/${ep}`);
    if (!episodeResponse.ok) {
      throw new Error('获取剧集地址失败');
    }
    const episodeData = await episodeResponse.json();
    return {
      title: videoData.data.title,
      displayName: videoData.data.displayName,
      cover: videoData.data.cover,
      address: episodeData.data.playurl,
      freeEpisodes: videoData.data.freeEpisodes, // 从 API 获取免费剧集数量
    };
  } catch (error) {
    console.error('Error fetching video or episode data:', error);
    throw error;
  }
}

// Function to fetch episodes from the API
async function fetchEpisodes(id: string, user: any): Promise<Episode[]> {
  try {
    const response = await axios.get(`${BASE_URL}/videos/${id}/user-episodes`, {
      headers: user ? { Authorization: `Bearer ${user.token}` } : {},
    });

    if (response.data.success) {
      return response.data.data.episodes; // Adjust this based on your API response structure
    } else {
      console.error('获取剧集信息失败');
      return [];
    }
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
}

// Main component for the video page
export default function VideoPage() {
  const params = useParams() as { id: string; ep: string };
  const { id, ep } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showPaymentOptionsFromSlider, setShowPaymentOptionsFromSlider] = useState(false);
  const [selectedEpisodeFromSlider, setSelectedEpisodeFromSlider] = useState<Episode | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchEpisodes(id, user).then(setEpisodes);
    }
  }, [id, user]);
  useEffect(() => {
    if (id && ep) {
      fetchVideoData(id, ep).then(data => {
        setVideoData(data);
      }).catch(error => {
        console.error('Error fetching video data:', error);
      });
    }
  }, [id, ep]); // 确保依赖项数组中包含 id 和 ep



  // If videoData is not yet available, show loading message
  if (!videoData) {
    return <div>加载中...</div>;
  }

  // 从 episode.address 提取最后三位数字并转换为整数
  // 取出问号前的部分
  const urlWithoutParams = videoData.address?.split('?')[0];
  // 匹配最后的三位数字
  const match = urlWithoutParams.match(/(\\d{3})\\.mp4$/);
  const episodeNumber = match ? parseInt(match[1], 10) : 0;
  const isFreeEpisode = episodeNumber <= videoData.freeEpisodes;

  // Find the current episode in the episodes list
  const currentEpisode = episodes.find(e => e.id === ep);
  const isLocked = currentEpisode ? currentEpisode.isLocked : true;

  // Determine if the video can be played
  const canPlayVideo = (user && !isLocked)|| isFreeEpisode;

  // Define getNextEpisodeUrl function
  const getNextEpisodeUrl = (currentEpisodeId: string): string | null => {
    const currentIndex = episodes.findIndex(e => e.id === currentEpisodeId);
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      return `/${id}/${episodes[currentIndex + 1].id}`;
    }
    return null;
  };

  // Function to handle video end
  const handleVideoEnd = () => {
    const nextEpisodeUrl = getNextEpisodeUrl(ep);
    if (nextEpisodeUrl) {
      router.push(nextEpisodeUrl);
    } else {
      if (user) {
        alert('已播放完毕');
      } else {
        console.log('请登录查看下一集');
      }
    }
  };

  // Function to update video URL
  const updateVideoUrl = (newUrl: string) => {
    console.log('切换到新视频 URL:', newUrl);
    // 这里可以添加逻辑来更新视频 URL
  };

  // Function to handle episode change from vertical slider
  const handleEpisodeChange = (episodeId: string) => {
    console.log('通过滑动切换到剧集:', episodeId);
    // 这里可以添加额外的剧集切换逻辑
  };

  // Function to handle locked episode access from vertical slider
  const handleLockedEpisodeAccess = (episode: Episode) => {
    console.log('滑动访问锁定剧集:', episode.title);
    setSelectedEpisodeFromSlider(episode);
    setShowPaymentOptionsFromSlider(true);
  };

  // Render the video player and other components
  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 text-white text-2xl z-30">
        {videoData.displayName}
      </div>
      <div className="relative flex-grow flex items-center justify-center">
        {canPlayVideo ? (
          <VideoPlayer
            initialUrl={videoData.address}
            title={videoData.displayName}
            cover={videoData.cover}
            id={id}
            onEnded={handleVideoEnd}
          />
        ) : (
          <div className="text-white">暂无权限观看此剧集</div>
        )}
      </div>
      
      {/* 竖屏滑动组件 */}
      {episodes.length > 0 && (
        <VerticalSlider
          episodes={episodes}
          currentEpisodeId={ep}
          videoId={id}
          onEpisodeChange={handleEpisodeChange}
          onLockedEpisodeAccess={handleLockedEpisodeAccess}
        />
      )}
      
      <UserAvatar />
      <EpisodeList 
        updateVideoUrl={updateVideoUrl} 
        id={id} 
        currentEpisodeId={ep}
        externalPaymentOptions={showPaymentOptionsFromSlider}
        externalSelectedEpisode={selectedEpisodeFromSlider}
        onExternalPaymentClose={() => {
          setShowPaymentOptionsFromSlider(false);
          setSelectedEpisodeFromSlider(null);
        }}
      />
      {/*<style jsx>{`
         .issue-button-class {
          display: none !important;
        }
      `}</style>*/}
    </div>
  );
}
