import {
  ApiResponse,
  LoginResponse,
  RegisterResponse,
  TempUserResponse,
  Video,
  VideoPricing,
  Episode,
  PaymentResponse,
  VVVIPResponse,
} from '@/types/api';
import axios from 'axios';

// 直接使用外部服务器地址
import { BASE_URL } from '@/lib/api';
// 获取token
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// 设置token
export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// 移除token
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// 通用请求方法
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`尝试请求 (${retryCount + 1}/${maxRetries}):`, {
        url: `${BASE_URL}${endpoint}`,
        method: options.method,
        headers,
        body: options.body,
      });

      const response = await axios({
        url: `${BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        headers: Object.fromEntries(Object.entries(headers)),
        data: options.body,
        timeout: 10000, // 10秒超时
      });

      console.log('收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      return response.data;
    } catch (error: any) {
      console.error(`请求失败 (${retryCount + 1}/${maxRetries}):`, error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          switch (error.response.status) {
            case 400:
              return {
                success: false,
                error: '请求参数错误，请检查输入',
              };
            case 401:
              return {
                success: false,
                error: '未认证或认证失败，请登录',
              };
            case 404:
              return {
                success: false,
                error: '资源不存在，请检查请求路径',
              };
            case 409:
              return {
                success: false,
                error: '资源冲突，可能是用户名已存在',
              };
            case 500:
              return {
                success: false,
                error: '服务器内部错误，请稍后重试',
              };
            default:
              return {
                success: false,
                error: `请求失败，状态码: ${error.response.status}`,
              };
          }
        }

        if (error.code === 'ECONNABORTED') {
          if (retryCount === maxRetries - 1) {
            return {
              success: false,
              error: '无法连接到服务器，请检查网络连接或联系管理员',
            };
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 指数退避
          continue;
        }
      }

      return {
        success: false,
        error: error.message || '请求失败',
      };
    }
  }

  return {
    success: false,
    error: '请求失败，请稍后重试',
  };
}

// 用户认证相关接口
export const auth = {
  // 用户登录
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // 用户注册
  register: (username: string, password: string) =>
    request<RegisterResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // 临时用户注册
  registerTemp: (username: string, password: string) =>
    request<TempUserResponse>('/register/temp', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// 视频相关接口
export const video = {
  // 获取视频信息
  getInfo: (id: string) =>
    request<Video>(`/videos/${id}`, {
      method: 'GET',
    }),

  // 获取视频价格信息
  getPricing: (id: string) =>
    request<VideoPricing>(`/videos/${id}/pricing`, {
      method: 'GET',
    }),

  // 获取用户可访问的剧集
  getUserEpisodes: (id: string) =>
    request<Episode[]>(`/videos/${id}/user-episodes`, {
      method: 'GET',
    }),
};

// 支付相关接口
export const payment = {
  // 扫码支付
  scan: (userId: string, episodeId: string, price: number) =>
    request<PaymentResponse>('/payment/scan', {
      method: 'POST',
      body: JSON.stringify({ userId, episodeId, price }),
    }),

  // 余额支付（单集）
  balance: (userId: string, episodeId: string, price: number) =>
    request<PaymentResponse>('/payment/balance', {
      method: 'POST',
      body: JSON.stringify({ userId, episodeId, price }),
    }),

  // 余额支付（全集）
  balanceAll: (userId: string, videoId: string, price: number) =>
    request<PaymentResponse>('/payment/balance/all', {
      method: 'POST',
      body: JSON.stringify({ userId, videoId, price }),
    }),

  // VVVIP支付
  vvvip: (userId: string, price: number) =>
    request<VVVIPResponse>('/payment/vvvip', {
      method: 'POST',
      body: JSON.stringify({ userId, price }),
    }),

  // 撤销VVVIP权限
  revokeVvvip: (userId: string) =>
    request<{ message: string }>('/payment/revoke-vvvip', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
}; 