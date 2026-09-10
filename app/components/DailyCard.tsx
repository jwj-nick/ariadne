'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Emblem from './Emblem';
import { thumbUrl } from '../lib/image';
import { today } from '../lib/learning/sm2';

export interface DailyItem {
  slug: string;
  name_ko: string;
  name_en: string;
  why: string;
  emblem: string;
  file?: string;
}

/** 날짜 문자열을 숫자로 만든다. 같은 날에는 같은 것이 나오고, 날이 바뀌면 바뀐다. */
function seedOf(day: string): number {
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 홈의 "오늘의 한 장" (D34).
 *
 * 목록만 놓아 두면 이 앱이 무엇을 주는지가 글로만 설명된다.
 * 실물 한 장을 그림째 올려 두면 설명이 필요 없다.
 *
 * 첫 그림은 서버가 정한 것을 그대로 쓰고, 붙고 나서 오늘 날짜의 것으로 바꾼다.
 * 처음부터 날짜로 고르면 서버와 브라우저가 서로 다른 것을 그려 경고가 난다.
 */
export default function DailyCard({ items }: { items: DailyItem[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length > 0) setIdx(seedOf(today()) % items.length);
  }, [items.length]);

  const item = items[idx];
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 고른 것이 바뀌면 그림도 처음부터 다시 받는다.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [idx]);

  if (!item) return null;
  const src = item.file ? thumbUrl(item.file, 260) : null;

  return (
    <section className="mt-7">
      <h2 className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--muted)' }}>
        오늘의 한 장
      </h2>
      <Link
        href={`/trace/${item.slug}`}
        className="flex gap-3.5 overflow-hidden rounded-xl p-3 transition-transform active:scale-[0.99]"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      >
        <span
          className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ width: 92, height: 92, background: 'var(--thread-soft)' }}
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
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 200ms ease' }}
            />
          ) : null}
          {(!src || failed || !loaded) && (
            <span className="absolute" style={{ color: 'var(--thread)', opacity: 0.55 }}>
              <Emblem name={item.emblem} size={34} strokeWidth={6} />
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-[17px] leading-tight font-semibold">{item.name_ko}</span>
          <span className="wordmark mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
            {item.name_en}
          </span>
          <span className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {item.why}
          </span>
        </span>
      </Link>
    </section>
  );
}
