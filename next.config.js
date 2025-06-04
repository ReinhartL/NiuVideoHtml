/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 警告：这允许生产构建即使项目有 ESLint 错误也能成功完成
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
};

module.exports = nextConfig;
