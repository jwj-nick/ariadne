'use client';

import { useEffect } from 'react';

/**
 * 서비스 워커를 등록한다 (M2-1).
 *
 * 배포 경로가 달라지므로(루트일 수도 있고 /ariadne 일 수도 있다) 경로를 환경변수에서 받는다.
 * 등록에 실패해도 앱은 그대로 돌아야 하므로 조용히 넘긴다.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => undefined);
  }, []);
  return null;
}
