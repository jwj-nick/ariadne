'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 공유 시트로 들어온 쿼리만 읽어 넘겨준다.
 *
 * `useSearchParams` 는 그것을 쓰는 컴포넌트 위에 Suspense 경계를 요구하고,
 * 그 경계 아래는 서버에서 그려지지 않는다. 그래서 캡처 화면 전체를 감싸면
 * 첫 화면이 통째로 비어 버린다. 쿼리를 읽는 이 작은 조각만 떼어 두면
 * 안내와 입력 칸은 서버에서 그대로 그려진다.
 */
export default function ShareIntake({ onShare }: { onShare: (text: string, url: string, title: string) => void }) {
  const params = useSearchParams();

  useEffect(() => {
    const text = params.get('text') ?? '';
    const url = params.get('url') ?? '';
    const title = params.get('title') ?? '';
    if (!text && !url && !title) return;

    // 같은 주소를 새로 고쳐도 두 번 담기지 않게 표시를 남긴다.
    const stamp = `${title}|${text}|${url}`;
    try {
      if (window.sessionStorage.getItem('ariadne.v1.lastShare') === stamp) return;
      window.sessionStorage.setItem('ariadne.v1.lastShare', stamp);
    } catch {
      // 저장 공간이 막혔으면 그냥 담는다. 중복은 목록에서 지우면 된다.
    }
    onShare(text, url, title);
  }, [params, onShare]);

  return null;
}
