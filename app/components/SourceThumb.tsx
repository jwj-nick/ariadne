'use client';

import Link from 'next/link';
import { useState } from 'react';
import { thumbUrl } from '../lib/image';

/**
 * 흔적 카드에 곁들이는 원천의 작은 그림 (D32).
 *
 * 흔적 자체의 그림이 있는 카드에서는 그 그림이 본문 위에 크게 걸린다.
 * 그런데 <비너스의 탄생> 카드에 보티첼리 그림만 있으면, 그 여신이 어떤 모습으로
 * 전해져 왔는지가 보이지 않는다. 원천의 그림을 여기에 함께 두면
 * "이 그림이 그 신을 그린 것" 이라는 관계가 한눈에 잡힌다.
 *
 * 못 불러 왔으면 통째로 감춘다. 문양이 이미 그 자리를 지키고 있다.
 */
export default function SourceThumb({
  file,
  href,
  name,
}: {
  file: string;
  href: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return null;

  return (
    <Link
      href={href}
      className="mt-2.5 flex items-center gap-2.5 rounded-md p-1.5 transition-colors"
      style={{ background: 'var(--thread-soft)' }}
    >
      <span
        className="block shrink-0 overflow-hidden rounded"
        style={{ width: 52, height: 52, background: 'var(--line)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl(file, 160)}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 200ms ease' }}
        />
      </span>
      <span className="min-w-0 text-[12px] leading-snug" style={{ color: 'var(--thread)' }}>
        원천 {name} 의 모습 보러 가기
      </span>
    </Link>
  );
}
