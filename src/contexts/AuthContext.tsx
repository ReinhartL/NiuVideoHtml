'use client';

import { BASE_URL } from '@/lib/api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/api';
import { auth, setToken, removeToken } from '@/utils/api';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  registerTemp: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  fetchUserInfo: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从localStorage中恢复用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user'); // 清除无效的用户数据
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await auth.login(username, password);
      if (response.success && response.data) {
        const userData = {
          ...response.data.user,
          token: response.data.token,
        };
        setUser(userData);
        setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || '登录失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await auth.register(username, password);
      if (response.success && response.data) {
        const userData = {
          ...response.data.user,
          token: response.data.token,
        };
        setUser(userData);
        setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || '注册失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const registerTemp = async (username: string, password: string) => {
    try {
      const response = await auth.registerTemp(username, password);
      if (response.success && response.data) {
        const userData = {
          ...response.data.tempUser,
          token: response.data.token,
        };
        setUser(userData);
        setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || '临时注册失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem('user');
  };

  const fetchUserInfo = async () => {
    if (user && user.id) {
      try {
        const response = await axios.get(`${BASE_URL}/user/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (response.data.success) {
          setUser((prevUser) => ({
            ...prevUser,
            balance: response.data.data.balance,
            level: response.data.data.level,
            id: prevUser?.id || '',
            username: prevUser?.username || '',
            nickname: response.data.data.nickname || '',
            token: prevUser?.token || '',
          }));
        } else {
          console.error('获取用户信息失败:', response.data.error);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    } else {
      console.error('用户信息无效，无法获取用户信息');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerTemp, logout, setUser, fetchUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}