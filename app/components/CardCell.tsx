'use client';

import Link from 'next/link';
import { useState } from 'react';
import Emblem from './Emblem';
import { thumbUrl } from '../lib/image';

export interface CellCard {
  id: string;
  href: string;
  name_ko: string;
  name_en: string;
  /** 위키미디어 파일 이름. 없으면 문양만 보인다. */
  file?: string;
  emblem: string;
}

/**
 * 격자 한 칸. 그림이 오면 그림이, 못 오면 문양이 남는다.
 *
 * 갈래별 보기(D31)와 실(D39)이 함께 쓴다. 두 화면에서 같은 카드가 같은 모습으로 보여야
 * "아까 본 그것" 이라는 감각이 생긴다.
 */
export default function CardCell({ card }: { card: CellCard }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = card.file ? thumbUrl(card.file, 200) : null;

  return (
    <Link
      href={card.href}
      className="group flex flex-col overflow-hidden rounded-lg transition-transform active:scale-[0.98]"
      style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '1 / 1', background: 'var(--thread-soft)' }}
      >
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 200ms ease' }}
          />
        ) : null}
        {/* 그림이 아직 없거나 못 왔을 때 자리를 지킨다. */}
        {(!src || failed || !loaded) && (
          <span className="absolute" style={{ color: 'var(--thread)', opacity: 0.55 }}>
            <Emblem name={card.emblem} size={30} strokeWidth={6} />
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <div className="truncate text-[12.5px] font-medium leading-tight">{card.name_ko}</div>
        <div className="wordmark truncate text-[10.5px] leading-tight" style={{ color: 'var(--muted)' }}>
          {card.name_en}
        </div>
      </div>
    </Link>
  );
}
