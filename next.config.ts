import type { NextConfig } from 'next';

/**
 * 배포처가 둘이다.
 *
 * - **Vercel** (docs/01-DESIGN-LOG.md D5) 이 최종 목적지다.
 *   M2 의 캡처 매칭과 AI 튜터가 서버 함수를 필요로 하기 때문이다. 이때는 아래 환경변수를 켜지 않는다.
 * - **GitHub Pages** 는 지금 단계의 확인용이다. 조회 화면만 있는 M0 는 서버가 할 일이 없어서
 *   정적 파일로 그대로 낼 수 있다. `ARIADNE_BASE_PATH=/ariadne` 를 주면 정적 내보내기로 바뀐다.
 *
 * 한쪽을 위해 다른 쪽을 포기하지 않도록 환경변수 하나로만 갈라 두었다.
 */
const basePath = process.env.ARIADNE_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 클라이언트에서도 배포 경로를 알아야 서비스 워커를 알맞은 자리에 등록할 수 있다.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(basePath
    ? {
        basePath,
        output: 'export' as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
