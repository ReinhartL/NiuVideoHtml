'use client';
import { BASE_URL } from '@/lib/api';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';


interface Episode {
  id: string;
  title: string;
  isLocked: boolean;
}

interface Video {
  id: string;
  title: string;
  displayName: string;
  cover: string;
  description: string;
  singleEpisodePrice: number;
  allEpisodesPrice: number;
}

interface SimpleEpisodeListProps {
  videoId: string;                          // 视频ID
  currentEpisodeId?: string;                // 当前播放的剧集ID（可选）
  onEpisodeSelect?: (episodeId: string) => void;  // 选择剧集的回调（可选）
}

// 组件暴露的方法接口
export interface SimpleEpisodeListRef {
  expandAndShowPayment: (episodeId: string) => void;
  collapse: () => void;
}

// 支付选项组件
function PaymentOptions({ onClose, onOptionSelect, videoInfo }: {
  onClose: () => void;
  onOptionSelect: (option: number) => void;
  videoInfo: Video;
}) {
  return (
    <div className="transform -translate-x-full bg-white p-4 rounded-lg shadow-lg z-50 w-64">
      <h2 className="text-xl font-bold mb-4">解锁选项</h2>
      <div className="space-y-2">
        <button 
          onClick={() => onOptionSelect(1)} 
          className="block w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <div className="flex justify-between items-center">
            <span>扫码解锁本集</span>
            <span className="font-bold">¥{videoInfo.singleEpisodePrice}</span>
          </div>
        </button>
        <button 
          onClick={() => onOptionSelect(2)} 
          className="block w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          <div className="flex justify-between items-center">
            <span>扫码解锁全集</span>
            <span className="font-bold">¥{videoInfo.allEpisodesPrice}</span>
          </div>
        </button>
        <button 
          onClick={() => onOptionSelect(3)} 
          className="block w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          <div className="flex justify-between items-center">
            <span>余额解锁本集</span>
            <span className="font-bold">¥{videoInfo.singleEpisodePrice}</span>
          </div>
        </button>
        <button 
          onClick={() => onOptionSelect(4)} 
          className="block w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          <div className="flex justify-between items-center">
            <span>余额解锁全集</span>
            <span className="font-bold">¥{videoInfo.allEpisodesPrice}</span>
          </div>
        </button>
      </div>
      <button 
        onClick={onClose} 
        className="block w-full p-3 bg-gray-500 text-white rounded mt-4 hover:bg-gray-600 transition"
      >
        取消
      </button>
    </div>
  );
}

const SimpleEpisodeList = forwardRef<SimpleEpisodeListRef, SimpleEpisodeListProps>(({ 
  videoId, 
  currentEpisodeId,
  onEpisodeSelect
}, ref) => {
  const router = useRouter();
  const { user, fetchUserInfo, login, registerTemp } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [videoInfo, setVideoInfo] = useState<Video | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(false);



  // 获取剧集信息
  const fetchEpisodes = async () => {
    if (!videoId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/videos/${videoId}/user-episodes`, {
        headers: user ? { Authorization: `Bearer ${user.token}` } : {},
      });

      if (response.data.success) {
        setEpisodes(response.data.data.episodes);
        setVideoInfo(response.data.data.video);
      }
    } catch (error) {
      console.error('获取剧集信息时发生错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchEpisodes();
  }, [user, videoId]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    expandAndShowPayment: (episodeId: string) => {
      const targetEpisode = episodes.find(ep => ep.id === episodeId);
      if (targetEpisode && targetEpisode.isLocked) {
        setIsExpanded(true);
        setSelectedEpisode(targetEpisode);
        setShowPaymentOptions(true);
      }
    },
    collapse: () => {
      setIsExpanded(false);
      setShowPaymentOptions(false);
    }
  }), [episodes]);

  // 处理剧集点击
  const handleEpisodeClick = (episode: Episode) => {
    if (episode.isLocked) {
      setShowPaymentOptions(true);
      setSelectedEpisode(episode);
    } else {
      // 优先使用回调函数，如果没有提供则使用路由跳转
      if (onEpisodeSelect) {
        onEpisodeSelect(episode.id);
      } else {
        const newUrl = `/${videoId}/${episode.id}`;
        router.push(newUrl);
      }
      setIsExpanded(false); // 选择后关闭列表
    }
  };

  // 处理支付选项
  const handlePaymentOptionSelect = async (option: number) => {
    if (!user) {
      const confirmRegister = window.confirm("您尚未登录，是否一键注册并登录？");
      if (confirmRegister) {
        try {
          const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
          const randomPassword = Math.random().toString(36).substring(2, 10);
          await registerTemp(randomUsername, randomPassword);
          await login(randomUsername, randomPassword);
          const message = `注册成功！用户名: ${randomUsername}, 密码: ${randomPassword}`;
          if (window.confirm(`${message}\n请截图保存并点击确定以刷新页面。`)) {
            window.location.reload();
          }
        } catch (error) {
          console.error('注册或登录失败:', error);
        }
      }
      return;
    }

    if (!selectedEpisode || !videoInfo) return;

    try {
      let apiUrl = '';
      let payload = {};

      switch (option) {
        case 1: // 扫码解锁本集
          const orderResponse = await axios.post(`${BASE_URL}/user/create_order`, {
            userId: user.id,
            amount: videoInfo.singleEpisodePrice,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
          });

          if (orderResponse.data.success) {
            const orderId = orderResponse.data.data.order.orderID;
            const payUrl = orderResponse.data.data.payUrl;
            window.open(payUrl, '_blank');

            // 轮询订单状态
            const pollOrderStatus = setInterval(async () => {
              try {
                const statusResponse = await axios.post(`${BASE_URL}/user/query_order`, {
                  orderId,
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                  },
                });

                if (statusResponse.data.success && statusResponse.data.data.status === 2) {
                  clearInterval(pollOrderStatus);
                  
                  // 解锁单集
                  const unlockResponse = await axios.post(`${BASE_URL}/unlock/single-episode`, {
                    userId: user.id,
                    episodeId: selectedEpisode.id,
                    price: videoInfo.singleEpisodePrice
                  }, {
                    headers: { Authorization: `Bearer ${user.token}` },
                  });

                  if (unlockResponse.data.success) {
                    fetchEpisodes();
                  }
                }
              } catch (error) {
                console.error('查询订单状态失败:', error);
              }
            }, 5000);

            setTimeout(() => {
              clearInterval(pollOrderStatus);
            }, 60000);
          }
          break;

        case 2: // 扫码解锁全集
          // 类似的逻辑，为了简化这里只写关键部分
          apiUrl = `${BASE_URL}/unlock/all-episodes`;
          payload = { userId: user.id, videoId: videoId, price: videoInfo.allEpisodesPrice };
          break;

        case 3: // 余额解锁本集
          apiUrl = `${BASE_URL}/balance/unlock-single-episode`;
          payload = { userId: user.id, episodeId: selectedEpisode.id, price: videoInfo.singleEpisodePrice };
          break;

        case 4: // 余额解锁全集
          apiUrl = `${BASE_URL}/balance/unlock-all-episodes`;
          payload = { userId: user.id, videoId: videoId, price: videoInfo.allEpisodesPrice };
          break;

        default:
          return;
      }

      if (apiUrl && option !== 1) {
        const response = await axios.post(apiUrl, payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.data.success) {
          fetchEpisodes();
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const confirmRecharge = window.confirm("余额不足，是否跳转充值界面？");
        if (confirmRecharge) {
          router.push('/rechargepage');
        }
      } else {
        console.error('操作失败');
      }
    } finally {
      setShowPaymentOptions(false);
    }
  };

  if (!episodes.length && !loading) {
    return null; // 没有剧集时不显示组件
  }

  return (
    <div className="fixed right-4 bottom-[15%] z-[9999] flex items-end">
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed right-4 bottom-[15%] w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {showPaymentOptions && videoInfo && (
          <div className="absolute bottom-12 w-64 z-10">
            <PaymentOptions 
              onClose={() => setShowPaymentOptions(false)} 
              onOptionSelect={handlePaymentOptionSelect}
              videoInfo={videoInfo}
            />
          </div>
        )}

        {isExpanded && (
          <div className="absolute right-0 bottom-12 w-64 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">选集列表</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {episodes.map((episode) => {
                const isCurrentEpisode = currentEpisodeId === episode.id;
                return (
                  <button
                    key={episode.id}
                    onClick={() => handleEpisodeClick(episode)}
                    className={`p-2 rounded text-center transition-colors relative ${
                      isCurrentEpisode
                        ? 'bg-white/25 backdrop-blur-sm text-white border border-white/40 shadow-lg ring-1 ring-white/20'
                        : episode.isLocked
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="relative">
                      <span className={isCurrentEpisode ? 'font-semibold text-shadow' : ''}>
                        {episode.title}
                      </span>
                      {episode.isLocked && (
                        <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded">
                          锁定
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SimpleEpisodeList.displayName = 'SimpleEpisodeList';

export default SimpleEpisodeList;