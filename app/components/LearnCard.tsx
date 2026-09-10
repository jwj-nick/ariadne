'use client';

import Link from 'next/link';
import { useState } from 'react';
import Emblem from './Emblem';
import { thumbUrl } from '../lib/image';

/**
 * 오늘 처음 만나는 이름을 보여 주는 자리 (D36).
 *
 * 이 자리가 없을 때에는 아무것도 모르는 사람에게 "이 이름이 왜 붙었는지 설명해 보십시오" 를
 * 먼저 물었다. 생성 효과(D6)는 조금이라도 아는 것에서 가장 크고, 아무것도 모르는 자리에서는
 * 좌절만 남는다. 그래서 삼십 초 읽히고 나서 바로 되묻는다.
 *
 * 그림을 크게 거는 이유는, 이름 열 자보다 그림 한 장이 오래 남기 때문이다 (D32).
 */
export default function LearnCard({
  nameKo,
  nameEn,
  kicker,
  why,
  sourceName,
  sourceKicker,
  emblem,
  file,
  slug,
  onReady,
}: {
  nameKo: string;
  nameEn: string;
  kicker?: string;
  why?: string;
  sourceName?: string;
  sourceKicker?: string;
  emblem?: string;
  file?: string;
  slug: string;
  onReady: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = file ? thumbUrl(file, 760) : null;

  return (
    <div>
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-xl"
        style={{ aspectRatio: '16 / 10', background: 'var(--thread-soft)' }}
      >
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 250ms ease' }}
          />
        ) : null}
        {(!src || failed || !loaded) && (
          <span className="absolute" style={{ color: 'var(--thread)', opacity: 0.5 }}>
            <Emblem name={emblem ?? 'maze'} size={64} strokeWidth={5} />
          </span>
        )}
      </div>

      <header className="mt-4">
        {kicker && (
          <p className="text-[12px]" style={{ color: 'var(--thread)' }}>
            {kicker}
          </p>
        )}
        <h1 className="mt-0.5 text-[26px] leading-tight font-semibold">{nameKo}</h1>
        <p className="wordmark mt-0.5 text-[15px]" style={{ color: 'var(--muted)' }}>
          {nameEn}
        </p>
      </header>

      {why && <p className="mt-3.5 text-[15.5px] leading-relaxed">{why}</p>}

      {sourceName && (
        <div
          className="mt-4 flex items-center gap-3 rounded-lg px-3.5 py-3"
          style={{ background: 'var(--thread-soft)' }}
        >
          <span className="shrink-0" style={{ color: 'var(--thread)' }}>
            <Emblem name={emblem ?? 'maze'} size={34} strokeWidth={5.5} />
          </span>
          <span className="min-w-0 text-[14px] leading-snug">
            이 이름은 <strong style={{ color: 'var(--thread)' }}>{sourceName}</strong>에서 왔습니다.
            {sourceKicker && (
              <span className="ml-1 text-[12px]" style={{ color: 'var(--muted)' }}>
                {sourceKicker}
              </span>
            )}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onReady}
        className="mt-6 w-full rounded-lg py-3 text-[15.5px] font-medium"
        style={{ background: 'var(--thread)', color: '#fff' }}
      >
        외웠습니다. 맞혀 보겠습니다
      </button>

      <p className="mt-3 text-center text-[13px]">
        <Link href={`/trace/${slug}`} className="thread-link">
          카드 전체 읽어 보기
        </Link>
      </p>
    </div>
  );
}
