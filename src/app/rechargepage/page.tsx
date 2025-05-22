'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // 导入 axios
import { Toaster } from 'react-hot-toast';
import { BASE_URL } from '@/lib/api';

export default function RechargePage() {
  const { user, fetchUserInfo } = useAuth(); // 获取用户信息和刷新函数
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRecharge = async (amount: number, isVip: boolean = false) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      // 1. 发送创建订单请求
      const orderResponse = await axios.post(`${BASE_URL}/user/create_order`, {
        userId: user.id,
        amount,
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
      // 从 orderData.data.order 中提取 orderID
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
          console.log(statusResponse.data);
          const statusData = statusResponse.data;
          if (statusData.success && statusData.data.status === 2) {
            clearInterval(pollOrderStatus);
            toast.success('支付成功！');
            // 4. 支付完成后，发送充值请求
            await sendRechargeRequest(amount, isVip);
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

    } catch (error) {
      console.error('请求失败:', error);
      toast.error('请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const sendRechargeRequest = async (amount: number, isVip: boolean) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    const apiUrl = isVip ? `${BASE_URL}/user/recharge_vip` : `${BASE_URL}/user/recharge`;
    try {
      const response = await axios.put(apiUrl, {
        userId: user.id,
        amount,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`, 
        },
      });
      const data = response.data;
      if (data.success) {
        if (isVip) {
          const endTime = data.data.endTime; // 获取会员有效期
          if (endTime) {
            // 格式化日期为 YYYY-MM-DD HH:mm
            const formattedEndTime = new Date(endTime).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false, // 24小时制
            }).replace(/\//g, '-'); // 将斜杠替换为短横线

            toast.success(`会员开通成功，当前有效期至：${formattedEndTime}`);
          } else {
            toast.error('获取有效期失败，请稍后重试');
          }
        } else {
          const pay_url = data.data.payUrl;
          window.open(pay_url, '_blank');
          const newBalance = parseFloat(data.data.newBalance).toFixed(2); // 格式化余额
          toast.success(`充值成功！当前余额: ¥${newBalance}`);
        }
        await fetchUserInfo(); // 刷新用户信息
      } else {
        toast.error(data.error || '充值失败，请稍后重试');
      }
    } catch (error) {
      console.error('充值请求失败:', error);
      toast.error('充值请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back(); // 返回前一个页面
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="flex items-center justify-between w-full max-w-md mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition flex items-center"
          >
            <span className="mr-2">🔙</span> 返回
          </button>
          <h1 className="text-3xl font-bold text-gray-800">充值页面</h1>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">请选择充值金额</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRecharge(2.9)}
              className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              充值 ¥2.9
            </button>
            <button
              onClick={() => handleRecharge(9.9)}
              className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              充值 ¥9.9
            </button>
            <button
              onClick={() => handleRecharge(49.9)}
              className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              充值 ¥49.9
            </button>
            <button
              onClick={() => handleRecharge(99.9)}
              className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              充值 ¥99.9
            </button>
            <button
              onClick={() => handleRecharge(69.9, true)}
              className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              开通会员 ¥69.9/30days
            </button>
            <button
              onClick={() => handleRecharge(299.9, true)}
              className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
            >
              开通会员 ¥299.9/6months
            </button>
          </div>
          {loading && <p className="mt-4 text-gray-500">正在处理请求...</p>}
        </div>
      </div>
    </>
  );
}
