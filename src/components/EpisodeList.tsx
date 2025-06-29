'use client';
import { BASE_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // 导入 useAuth
import axios from 'axios'; // 导入 axios
import { toast } from 'react-hot-toast';

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

interface EpisodeListProps {
  updateVideoUrl: (url: string) => void;
  id: string; // 视频 ID
  currentEpisodeId?: string; // 当前播放的剧集 ID
}

// 支付选项组件
function PaymentOptions({ onClose, onOptionSelect, videoInfo }: any) {
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

export default function EpisodeList({ 
  id, 
  updateVideoUrl, 
  currentEpisodeId
}: EpisodeListProps) {
  const router = useRouter();
  const { user, fetchUserInfo, login,registerTemp } = useAuth(); // 使用 useAuth 获取用户信息
  const [isExpanded, setIsExpanded] = useState(false); // 控制选集列表的展开和收起状态
  const [episodes, setEpisodes] = useState<Episode[]>([]); // 存储剧集信息
  const [videoInfo, setVideoInfo] = useState<Video | null>(null); // 存储视频信息
  const [showPaymentOptions, setShowPaymentOptions] = useState(false); // 控制支付选项的显示
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null); // 选中的剧集
  // 获取剧集信息
  const fetchEpisodes = async () => {
    try {
      const userId = user ? user.id : ''; // 获取用户 ID
      const response = await axios.get(`${BASE_URL}/videos/${id}/user-episodes`, {
        headers: user ? { Authorization: `Bearer ${user.token}` } : {},
      });

      if (response.data.success) {
        setEpisodes(response.data.data.episodes); // 设置剧集信息
        setVideoInfo(response.data.data.video); // 设置视频信息
      } else {
        console.error('获取剧集信息失败');
      }
    } catch (error) {
      console.error('获取剧集信息时发生错误:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo(); // 获取用户信息
  }, []);

  useEffect(() => {
    fetchEpisodes(); // 获取剧集信息
  }, [user, id]); // 依赖于用户信息和视频 ID

  // 处理剧集点击事件
  const handleEpisodeClick = (episode: Episode) => {
    if (episode.isLocked) {
      setShowPaymentOptions(true);
      setSelectedEpisode(episode);
    } else {
      const newUrl = `/${id}/${episode.id}`;
      router.push(newUrl);
    }
  };

  const handlePaymentOptionSelect = async (option: number) => {
    if (!user) {
      // 用户未登录，提示一键注册
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
          // 1. 发送创建订单请求
          const orderResponse = await axios.post(`${BASE_URL}/user/create_order`, {
            userId: user.id,
            amount: videoInfo.singleEpisodePrice,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
          });

          const orderData = orderResponse.data;
          if (!orderData.success) {
            toast.error(orderData.error || '创建订单失败，请稍后重试');
            return;
          }

          const orderId = orderData.data.order.orderID;

          // 2. 打开支付页面
          const payUrl = orderData.data.payUrl;
          window.open(payUrl, '_blank');

          // 3. 轮询订单状态
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

              const statusData = statusResponse.data;
              if (statusData.success && statusData.data.status === 2) {
                clearInterval(pollOrderStatus);
                toast.success('支付成功！');
                // 4. 支付完成后，调用解锁接口
                apiUrl = `${BASE_URL}/unlock/single-episode`;
                payload = { userId: user.id, episodeId: selectedEpisode.id, price: videoInfo.singleEpisodePrice };
                const unlockResponse = await axios.post(apiUrl, payload, {
                  headers: { Authorization: `Bearer ${user.token}` },
                });

                if (unlockResponse.data.success) {
                  alert('解锁成功！');
                  fetchEpisodes(); // 重新获取剧集信息
                } else {
                  console.error('解锁失败');
                }
              }
            } catch (error) {
              console.error('查询订单状态失败:', error);
            }
          }, 5000); // 每5秒检查一次

          // 设置超时为1分钟
          const timeout = setTimeout(() => {
            clearInterval(pollOrderStatus);
            toast.error('支付超时，请重试');
          }, 60000); // 60000毫秒 = 1分钟

          break;
        case 2: // 扫码解锁全集
          // 1. 发送创建订单请求
          const orderResponseAll = await axios.post(`${BASE_URL}/user/create_order`, {
            userId: user.id,
            amount: videoInfo.allEpisodesPrice,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
          });

          const orderDataAll = orderResponseAll.data;
          if (!orderDataAll.success) {
            toast.error(orderDataAll.error || '创建订单失败，请稍后重试');
            return;
          }

          const orderIdAll = orderDataAll.data.order.orderID;

          // 2. 打开支付页面
          const payUrlAll = orderDataAll.data.payUrl;
          window.open(payUrlAll, '_blank');

          // 3. 轮询订单状态
          const pollOrderStatusAll = setInterval(async () => {
            try {
              const statusResponseAll = await axios.post(`${BASE_URL}/user/query_order`, {
                orderId: orderIdAll,
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`,
                },
              });

              const statusDataAll = statusResponseAll.data;
              if (statusDataAll.success && statusDataAll.data.status === 2) {
                clearInterval(pollOrderStatusAll);
                toast.success('支付成功！');
                // 4. 支付完成后，调用解锁接口
                apiUrl = `${BASE_URL}/unlock/all-episodes`;
                payload = { userId: user.id, videoId: id, price: videoInfo.allEpisodesPrice };
                const unlockResponseAll = await axios.post(apiUrl, payload, {
                  headers: { Authorization: `Bearer ${user.token}` },
                });

                if (unlockResponseAll.data.success) {
                  alert('解锁成功！');
                  fetchEpisodes(); // 重新获取剧集信息
                } else {
                  console.error('解锁失败');
                }
              }
            } catch (error) {
              console.error('查询订单状态失败:', error);
            }
          }, 5000); // 每5秒检查一次

          // 设置超时为1分钟
          const timeoutAll = setTimeout(() => {
            clearInterval(pollOrderStatusAll);
            toast.error('支付超时，请重试');
          }, 60000); // 60000毫秒 = 1分钟

          break;
        case 3: // 余额解锁本集
          apiUrl = `${BASE_URL}/balance/unlock-single-episode`;
          payload = { userId: user.id, episodeId: selectedEpisode.id, price: videoInfo.singleEpisodePrice };
          break;
        case 4: // 余额解锁全集
          apiUrl = `${BASE_URL}/balance/unlock-all-episodes`;
          payload = { userId: user.id, videoId: id, price: videoInfo.allEpisodesPrice };
          break;
        default:
          return;
      }

      const response = await axios.post(apiUrl, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.data.success) {
        alert('解锁成功！'); // 显示提示窗口
        fetchEpisodes(); // 重新获取剧集信息
      } else {
        console.error('解锁失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const confirmRecharge = window.confirm("余额不足，是否跳转充值界面？");
        if (confirmRecharge) {
          router.push('/rechargepage'); // 跳转至充值页面
        }
      } else {
        console.error('解锁时发生错误:', error);
      }
    } finally {
      setShowPaymentOptions(false);
    }
  };

  // Method to get the next episode URL
  const getNextEpisodeUrl = (currentEpisodeId: string): string | null => {
    const currentIndex = episodes.findIndex(e => e.id === currentEpisodeId);
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      return `/${id}/${episodes[currentIndex + 1].id}`;
    }
    return null;
  };

  return (
    <div className="fixed right-4 bottom-[15%] z-[9999] flex items-end">
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)} // 切换选集列表的展开和收起状态
          className="fixed right-4 bottom-[15%] w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
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
                onClick={() => setIsExpanded(false)} // 收起选集列表
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
                    onClick={() => handleEpisodeClick(episode)} // 处理剧集点击事件
                    className={`p-2 rounded text-center transition-colors relative ${
                      isCurrentEpisode
                        ? 'bg-white/25 backdrop-blur-sm text-white border border-white/40 shadow-lg ring-1 ring-white/20' // 当前剧集样式 - 毛玻璃风格
                        : episode.isLocked
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' // 锁定剧集的样式
                        : 'bg-white/10 text-white hover:bg-white/20' // 未锁定剧集的样式
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
}
