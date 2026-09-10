import type { MetadataRoute } from 'next';

/**
 * PWA 매니페스트 (M2-1, M2-2).
 *
 * 핵심은 `share_target` 이다. 폰의 공유 시트에서 글이나 주소를 이 앱으로 던지면
 * `/capture` 가 열리면서 쿼리로 내용이 넘어온다 (D3).
 *
 * 방식을 GET 으로 잡은 이유가 있다. 글과 주소는 GET 으로 받으면 브라우저가 알아서 페이지를 열어 주므로
 * 서비스 워커가 할 일이 없다. 이미지와 파일은 POST + multipart 라서 서비스 워커가 요청을 가로채
 * 폼 데이터를 꺼내 두었다가 넘겨주는 과정을 직접 만들어야 한다. 그쪽은 M2-6 으로 미뤘다 (Q3).
 *
 * ⚠️ Web Share Target 은 안드로이드 크롬 계열에서만 동작한다. iOS 사파리에는 없다.
 * 그래서 `/capture` 에는 직접 붙여 넣는 칸을 함께 두었다. 딸의 아이폰에서는 그쪽을 쓴다.
 */
const bp = process.env.ARIADNE_BASE_PATH ?? '';

// 환경변수를 읽으므로 Next 가 동적 경로로 보는데, 정적 내보내기에서는 그러면 빌드가 멈춘다.
// 값은 빌드 시점에 고정되므로 정적으로 못박아 둔다.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ariadne — 이름 뒤의 이야기',
    short_name: 'Ariadne',
    description: '나이키는 승리의 여신, 목성은 신들의 왕. 매일 쓰는 이름이 어디서 왔는지 찾아봅니다.',
    lang: 'ko',
    start_url: `${bp}/`,
    scope: `${bp}/`,
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#faf7f2',
    orientation: 'portrait',
    icons: [
      { src: `${bp}/icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${bp}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${bp}/icons/icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    share_target: {
      action: `${bp}/capture`,
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
    shortcuts: [
      { name: '오늘의 퀴즈', url: `${bp}/quiz` },
      { name: '본 것 담기', url: `${bp}/capture` },
    ],
  };
}
