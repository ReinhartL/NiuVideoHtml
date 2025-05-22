'use client';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();
  
  const { user, loading, fetchUserInfo } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  useEffect(() => {
    // 检测用户登录状态，如果用户存在，则获取用户信息
    if (user && user.id) {
      fetchUserInfo();
    }
  }, [user?.id]); // 依赖于 user.id
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

  return (
    <div className="w-full h-full overflow-y-auto bg-green-100">
      <div className="relative">
        <Slider autoplay arrows={false} dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
          <a href="/67fba200298c778ed739eb07/67fba200298c778ed739eb08" className="flex justify-center items-center h-96 bg-gray-200">
            <img src="/assets/images/cover1.png" alt="示例图片1" className="w-full h-full object-cover" />
          </a>
          <a href="/play/2" className="flex justify-center items-center h-96 bg-gray-200">
            <img src="/assets/images/cover2.png" alt="示例图片2" className="w-full h-full object-cover" />
          </a>
          <a href="/play/3" className="flex justify-center items-center h-96 bg-gray-200">
            <img src="/path/to/your/image3.jpg" alt="示例图片3" className="w-full h-full object-cover" />
          </a>
        </Slider>
        <button onClick={() => router.push('/userpage')} className="absolute top-4 right-4">
          {loading ? '加载中...' : user ? `hi, ${user.nickname}` : '用户中心'}
        </button>
      </div>
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">本周热门</h2>
        <div className="grid grid-cols-3 gap-6">
          <a href="/67fba200298c778ed739eb07/67fba200298c778ed739eb08" className="flex justify-center items-center h-96 bg-gray-200">
            <img src="/assets/images/cover1.png" alt="示例图片1" className="w-full h-full object-cover" />
          </a>
          <a href="/play/2" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">🎥</span>
          </a>
          <a href="/play/3" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">📽️</span>
          </a>
        </div>
        <h2 className="text-3xl font-bold my-6">新剧上线</h2>
        <div className="grid grid-cols-3 gap-6">
          <a href="/play/4" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">🎬</span>
          </a>
          <a href="/play/5" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">🎥</span>
          </a>
          <a href="/play/6" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">📽️</span>
          </a>
        </div>
        <h2 className="text-3xl font-bold my-6">排行榜</h2>
        <div className="grid grid-cols-3 gap-6">
          <a href="/play/7" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">🎬</span>
          </a>
          <a href="/play/8" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">🎥</span>
          </a>
          <a href="/play/9" className="flex justify-center items-center h-96 bg-gray-200">
            <span className="text-5xl">📽️</span>
          </a>
        </div>
      </div>
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-4 right-4">返回顶部</button>
      )}
    </div>
  );
}
