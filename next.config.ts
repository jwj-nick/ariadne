import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 콘텐츠는 빌드 시점에 app/data/graph.json 으로 굳어지므로 전부 정적으로 낼 수 있다.
  // 캡처와 퀴즈(M1~M2)가 들어오면 그때 서버 기능을 켠다.
  reactStrictMode: true,
};

export default nextConfig;
