'use client';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { BASE_URL } from '@/lib/api';

// 添加CSS样式
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// 定义数据类型
interface HomeConfigData {
  id: string;
  carousel: ProcessedVideoItem[];
  hot: ProcessedVideoItem[];
  new: ProcessedVideoItem[];
  rank: ProcessedVideoItem[];
}

interface ProcessedVideoItem {
  id: string;
  title: string;
  cover: string;
  link: string;
}

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [carouselData, setCarouselData] = useState<ProcessedVideoItem[]>([]);
  const [hotData, setHotData] = useState<ProcessedVideoItem[]>([]);
  const [newData, setNewData] = useState<ProcessedVideoItem[]>([]);
  const [rankData, setRankData] = useState<ProcessedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { user, loading: authLoading, fetchUserInfo } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  // 添加样式到head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // 获取首页配置数据的方法（简化版，直接使用返回的视频信息）
  const fetchHomeConfig = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      
      const response = await axios.get(`${BASE_URL}/home-config`);
      
      const configData: HomeConfigData = response.data.data || response.data;

      // 直接使用返回的视频数据，无需再次获取详情
      setCarouselData(configData.carousel || []);
      setHotData(configData.hot || []);
      setNewData(configData.new || []);
      setRankData(configData.rank || []);
      
      // 标记配置加载成功
      setIsConfigLoaded(true);
      
      // 清除重试定时器
      if (retryTimer) {
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }

      return response.data;
    } catch (error) {
      console.error('获取首页配置失败:', error);
      
      // 如果配置还没有加载成功，则设置重试
      if (!isConfigLoaded) {
        const timer = setTimeout(() => {
          console.log('重试获取首页配置...');
          fetchHomeConfig(true);
        }, 3000); // 3秒后重试
        
        setRetryTimer(timer);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 首页初始化时调用homeconfig接口
    fetchHomeConfig();
    
    // 检测用户登录状态，如果用户存在，则获取用户信息
    if (user && user.id) {
      fetchUserInfo();
    }
    
    // 清理函数：组件卸载时清除定时器
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }
    };
  }, [user?.id]); // 依赖于 user.id

  // 监听路由变化，在页面离开时清除定时器
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && retryTimer) {
        // 当页面变为隐藏状态时清除定时器
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }
    };

    // 监听页面卸载事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    // 监听页面可见性变化事件
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理事件监听器
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 清理定时器
      if (retryTimer) {
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }
    };
  }, [retryTimer]); // 依赖于 retryTimer

  // 监听路由路径变化，当离开home页面时清除定时器
  useEffect(() => {
    // 如果当前路径不是/home，说明已经离开了home页面，清除定时器
    if (pathname !== '/home' && retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
  }, [pathname, retryTimer]); // 监听pathname和retryTimer的变化
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 格式化链接，去掉第二个'/'之后的内容
  const formatLink = (link: string): string => {
    const parts = link.split('/');
    if (parts.length >= 3) {
      // 保留前两个部分：空字符串和ID
      return `/${parts[1]}`;
    }
    return link;
  };

  // 渲染视频列表
  const renderVideoList = (data: ProcessedVideoItem[], defaultContent: React.ReactNode, listType: string) => {
    if (loading) {
      return (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={`loading-${listType}-${i}`} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (data.length > 0) {
      // 根据类型获取标签配置
      const getTagConfig = (type: string, index: number) => {
        switch (type) {
          case 'hot':
            return { text: '热门', className: 'bg-red-500' };
          case 'new':
            return { text: '新剧', className: 'bg-blue-500' };
          case 'rank':
            const rankNumber = index + 1;
            const rankColors = {
              1: 'bg-yellow-500',
              2: 'bg-gray-500', 
              3: 'bg-orange-600'
            };
            return { 
              text: `第${rankNumber}名`, 
              className: rankColors[rankNumber as keyof typeof rankColors] || 'bg-purple-500'
            };
          default:
            return { text: '免费', className: 'bg-green-500' };
        }
      };

      return (
        <div className="grid grid-cols-3 gap-4">
          {data.map((item, index) => {
            const tagConfig = getTagConfig(listType, index);
            const formattedLink = formatLink(item.link);
            return (
              <a key={`${listType}-${item.id}-${index}`} href={formattedLink} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={item.cover} 
                      alt={item.title} 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/images/default-cover.jpg';
                      }}
                    />
                    {/* 动态标签 */}
                    <div className={`absolute top-2 left-2 ${tagConfig.className} text-white text-xs px-2 py-1 rounded`}>
                      {tagConfig.text}
                    </div>
                    {/* 播放按钮 */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      );
    }

    return defaultContent;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50">
      <div className="relative">
        <Slider 
          autoplay={carouselData.length > 1} 
          arrows={false} 
          dots={carouselData.length > 1} 
          infinite={carouselData.length > 1} 
          speed={500} 
          slidesToShow={1} 
          slidesToScroll={1}
        >
          {loading ? (
            <div>
              <div className="flex justify-center items-center h-64 bg-gray-200 animate-pulse">
                <span className="text-xl text-gray-500">加载中...</span>
              </div>
            </div>
          ) : carouselData.length > 0 ? (
            carouselData.map((item, index) => (
              <div key={`carousel-${item.id}-${index}`}>
                <a href={formatLink(item.link)} className="block relative">
                  <img 
                    src={item.cover} 
                    alt={item.title} 
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/images/default-cover.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-lg font-bold mb-1">{item.title}</h2>
                    <p className="text-sm opacity-90">正在热播</p>
                  </div>
                </a>
              </div>
            ))
          ) : (
            <div>
              <div className="flex justify-center items-center h-64 bg-gray-200">
                <span className="text-xl text-gray-500">暂无轮播图</span>
              </div>
            </div>
          )}
        </Slider>
        <button onClick={() => router.push('/userpage')} className="absolute top-4 right-4 bg-black/20 text-white px-3 py-1 rounded-full text-sm hover:bg-black/30 transition-colors">
          {authLoading ? '加载中...' : user ? `hi, ${user.nickname}` : '用户中心'}
        </button>
      </div>
      
      <div className="px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">本周热门</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">更多 →</button>
          </div>
          {renderVideoList(hotData, (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">暂无数据</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">暂无热门视频</h3>
                </div>
              </div>
            </div>
          ), 'hot')}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">新剧上线</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">更多 →</button>
          </div>
          {renderVideoList(newData, (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">暂无数据</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">暂无新剧</h3>
                </div>
              </div>
            </div>
          ), 'new')}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">排行榜</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">更多 →</button>
          </div>
          {renderVideoList(rankData, (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">暂无数据</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">暂无排行数据</h3>
                </div>
              </div>
            </div>
          ), 'rank')}
        </section>
      </div>
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="fixed bottom-6 right-6 bg-black/70 text-white p-3 rounded-full shadow-lg hover:bg-black/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
