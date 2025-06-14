'use client';
import { BASE_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import { signIn, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';


export default function UserPage() {
  const { user, loading, logout, register, registerTemp, fetchUserInfo } = useAuth();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.nickname || '');
  const [error, setError] = useState('');
  const [isUsernameUpdated, setIsUsernameUpdated] = useState(false);
  const [vipEndTime, setVipEndTime] = useState<string | null>(null);

  useEffect(() => {
    // 检测用户登录状态，如果用户存在，则获取用户信息
    if (isLoggedIn && user) {
      fetchUserInfo();
      checkVipStatus(); // 检查会员状态
    }
  }, [isLoggedIn]); // 依赖于 isLoggedIn

  useEffect(() => {
    // 更新状态以反映用户登录状态
    setIsLoggedIn(!!user);
    setNewUsername(user?.nickname || '');
  }, [user]); // 依赖于 user

  useEffect(() => {
    // 当用户名更新完成后，更新 newUsername
    if (isUsernameUpdated) {
      if (isLoggedIn && user) {
        fetchUserInfo();
        checkVipStatus(); // 检查会员状态
      }
      setNewUsername(user?.nickname || '');
      setIsUsernameUpdated(false); // 重置状态
    }
  }, [isUsernameUpdated]); // 依赖于 isUsernameUpdated

  const checkVipStatus = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`${BASE_URL}/user/vvviprecord`, {
        params: { userId: user.id },
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const data = response.data;
      if (data.success && data.data.endTime) {
        const formattedEndTime = new Date(data.data.endTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace(/\//g, '-');
        setVipEndTime(formattedEndTime);
      } else {
        setVipEndTime(null);
      }
    } catch (error) {
      console.error('获取会员状态失败:', error);
      setVipEndTime(null);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  const handleSignOut = () => {
    logout();
    setIsLoggedIn(false);
    setNewUsername(''); // 清空用户名状态
  };

  const handleUsernameClick = () => {
    if (isLoggedIn) {
      setIsEditingUsername(true);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError('用户名不能为空');
      return;
    }

    try {
      const response = await axios.put(`${BASE_URL}/user/update_nickname`, {
        id: user?.id,
        nickname: newUsername.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      if (!data.success) {
        setError(data.error);
        return;
      }

      setIsEditingUsername(false);
      setError('');
      setIsUsernameUpdated(true); // 设置用户名更新完成状态
      toast.success('用户名更新成功');

   

    } catch (error) {
      console.error('更新用户名失败:', error);
      setError('更新失败，请稍后重试');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateUsername();
    } else if (e.key === 'Escape') {
      setIsEditingUsername(false);
      setNewUsername(user?.nickname || '');
      setError('');
    }
  };

  const handleOneClickRegister = async () => {
    const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
    const randomPassword = Math.random().toString(36).substring(2, 10);

    try {
      await registerTemp(randomUsername, randomPassword);
      const message = `注册成功！用户名: ${randomUsername}, 密码: ${randomPassword}`;
      toast.success(message);
      if (window.confirm(`${message}\n请截图保存并点击确定以刷新页面。`)) {
        router.refresh();
      }
    } catch (error) {
        toast.error('注册失败');
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden relative p-6">
        <button onClick={() => router.replace('/home')} className="absolute top-4 right-4 text-2xl text-yellow-500">🏠</button>
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-2xl text-yellow-500">🔙</button>
        <h1 className="text-3xl font-bold mb-4 text-center text-yellow-600">用户中心</h1>
        <div className="flex items-center mb-6 justify-center">
          <img src="/assets/images/example1.jpg" alt="用户头像" className="w-32 h-32 rounded-full border-4 border-yellow-300 shadow-lg" />
          <div className="ml-4 text-center">
            {isLoggedIn ? (
              isEditingUsername ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleUpdateUsername}
                    autoFocus
                    className="text-xl font-semibold text-yellow-600 border-b-2 border-yellow-300 focus:outline-none bg-transparent"
                  />
                  {error && (
                    <div className="text-red-500 text-sm ml-2">{error}</div>
                  )}
                </div>
              ) : (
                <h2 
                  className="text-xl font-semibold text-yellow-600 cursor-pointer hover:text-yellow-700"
                  onClick={handleUsernameClick}
                  title="点击修改昵称"
                >
                  {user?.nickname}
                </h2>
              )
            ) : (
              <h2 className="text-xl font-semibold text-yellow-600">匿名用户</h2>
            )}
            {isLoggedIn && (
              <>
                <p className="text-yellow-500">等级: {user?.level || 'Level 0'}</p>
                <p className="text-yellow-500">余额: {parseFloat(user?.balance?.toString() || '0').toFixed(2)} 珍珠币</p>
                {vipEndTime && (
                  <p className="text-yellow-500">会员有效期至: {vipEndTime}</p>
                )}
              </>
            )}
          </div>
        </div>
        {isLoggedIn ? (
          <div className="mb-6">
            <button onClick={() => router.push('/chargingrecordpage')} className="block w-full p-2 bg-blue-500 text-white rounded-lg mb-2 hover:bg-blue-600 transition">查看消费记录</button>
            <button onClick={() => router.push('/rechargepage')} className="block w-full p-2 bg-yellow-500 text-white rounded-lg mb-2 hover:bg-yellow-600 transition">充值</button>
            <button onClick={handleSignOut} className="block w-full p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">注销</button>
          </div>
        ) : (
          <>
            <button onClick={() => router.push('/auth/signup')} className="block w-full p-2 mb-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">注册</button>
            <button onClick={() => router.push('/auth/signin')} className="block w-full p-2 mb-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">登录</button>
            <button onClick={handleOneClickRegister} className="block w-full p-2 mb-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">一键注册临时用户</button>
          </>
        )}
      </div>
    </div>
  );
}

