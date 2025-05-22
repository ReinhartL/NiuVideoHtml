'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UserAvatar() {
  const router = useRouter();
  const { user, loading, fetchUserInfo } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    // 检测用户登录状态，如果用户存在，则获取用户信息
    if (user && user.id) {
      fetchUserInfo();
    }
  }, [user?.id]); // 依赖于 user.id
  const handleClick = () => {
    if (user) {
      router.push('/userpage');
    } else {
      router.push('/auth/signin'); // 导向登录页面
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div 
        className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer"
        onClick={handleClick}
        onMouseEnter={() => {
          setShowDropdown(true);
        }}
        onMouseLeave={() => { // 添加调试日志
          setShowDropdown(false);
        }}
      >
        <Image
          src="/assets/images/example1.jpg" // 使用默认头像
          alt="用户头像"
          fill
          className="object-cover"
        />
      </div>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-32 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-2">
          {loading ? ( // 显示加载状态
            <div className="text-white text-sm">加载中...</div>
          ) : user ? ( // 显示用户名
            <div className="text-white">
              <div className="font-medium">hi, {user.nickname}</div>
              <div className="text-sm text-gray-300">点击查看个人信息</div>
            </div>
          ) : ( // 未登录状态
            <div className="text-white">
              <div className="text-sm text-gray-300">点击登录</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 