import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['file.psd.cn'], // 添加允许的域名
  },
};

export default nextConfig;
