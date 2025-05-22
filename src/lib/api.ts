export const BASE_URL = 'https://hkaveixilfpv.sealoshzh.site/api';

export const api = {
  // 用户认证相关
  auth: {
    signin: async (username: string, password: string) => {
      const response = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      return response.json();
    },
    signup: async (username: string, password: string) => {
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      return response.json();
    },
    registerTemp: async (username: string, password: string) => {
      const response = await fetch(`${BASE_URL}/register/temp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, expireTime: 7 }), // 7 days expiration
      });
      return response.json();
    },
  },

  // 视频相关
  videos: {
    getInfo: async (id: string) => {
      const response = await fetch(`${BASE_URL}/videos/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    getPricing: async (id: string) => {
      const response = await fetch(`${BASE_URL}/videos/${id}/pricing`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    getUserEpisodes: async (id: string) => {
      const response = await fetch(`${BASE_URL}/videos/${id}/user-episodes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
  },

  // 支付相关
  payment: {
    scan: async (userId: string, episodeId: string, price: number) => {
      const response = await fetch(`${BASE_URL}/payment/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, episodeId, price }),
      });
      return response.json();
    },
    balance: async (userId: string, episodeId: string, price: number) => {
      const response = await fetch(`${BASE_URL}/payment/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, episodeId, price }),
      });
      return response.json();
    },
    balanceAll: async (userId: string, videoId: string, price: number) => {
      const response = await fetch(`${BASE_URL}/payment/balance/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, videoId, price }),
      });
      return response.json();
    },
    vvvip: async (userId: string, price: number) => {
      const response = await fetch(`${BASE_URL}/payment/vvvip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, price }),
      });
      return response.json();
    },
    revokeVvvip: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/payment/revoke-vvvip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });
      return response.json();
    },
  },
};
