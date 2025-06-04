/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 警告：这允许生产构建即使项目有 ESLint 错误也能成功完成
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    // 明确允许 public/assets/images 下的所有图片被优化
    localPatterns: [
      {
        // 注意：这里的 pathname 要和你请求的 url 完全匹配
        pathname: '/assets/images/**',
      },
    ],
    // 如果你只是临时不想优化，也可以加下面一行跳过优化（会让 <Image> 直接输出 <img>）
    // unoptimized: true,
  },
};

module.exports = nextConfig;
