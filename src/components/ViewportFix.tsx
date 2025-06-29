'use client';

import { useEffect } from 'react';

export default function ViewportFix() {
  useEffect(() => {
    const setViewportHeight = () => {
      // 获取真实的视窗高度
      const vh = window.innerHeight * 0.01;
      const fullHeight = `${window.innerHeight}px`;
      
      // 设置CSS自定义属性
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--full-height', fullHeight);
    };

    // 初始设置
    setViewportHeight();

    // 监听resize事件（包括Safari工具栏的显示/隐藏）
    const handleResize = () => {
      setViewportHeight();
    };

    // 监听orientationchange事件（设备旋转）
    const handleOrientationChange = () => {
      // 延迟执行，等待浏览器完成方向变化
      setTimeout(setViewportHeight, 100);
    };

    // 监听视觉视窗变化（更精确的Safari检测）
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const fullHeight = `${window.visualViewport.height}px`;
        document.documentElement.style.setProperty('--full-height', fullHeight);
      }
    };

    // 添加事件监听器
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 如果支持Visual Viewport API（主要是Safari和Chrome移动端）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
} 