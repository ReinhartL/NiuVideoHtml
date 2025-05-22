// 通用响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  nickname: string;
  balance?: number;
  level?: string;
  password?: string;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface TempUser {
  id: string;
  username: string;
  nickname: string;
  balance?: number;
  level?: string;
  expireTime: string;
}

export interface TempUserRequest {
  username: string;
  password: string;
}

export interface TempUserResponse {
  tempUser: TempUser;
  token: string;
}

// 视频相关类型
export interface Video {
  id: string;
  title: string;
  cover: string;
  description: string;
}

export interface VideoPricing {
  singleEpisodePrice: number;
  memberSinglePrice: number;
  memberAllEpisodesPrice: number;
  vvvipPrice: number;
}

export interface Episode {
  id: string;
  title: string;
  isLocked: boolean;
}

// 支付相关类型
export interface PaymentRequest {
  userId: string;
  episodeId: string;
  price: number;
}

export interface PaymentResponse {
  paymentUrl?: string;
  orderId?: string;
  message?: string;
  expireTime?: string;
}

export interface VVVIPRequest {
  userId: string;
  price: number;
}

export interface VVVIPResponse {
  message: string;
  expireTime: string;
}
