'use client';

import { useState } from 'react';
import { sourcePage } from '../lib/image';
import { mapView, type MapPin } from '../lib/map';

/**
 * 지명 카드의 지도 (D48).
 *
 * 계산은 app/lib/map.ts 가 하고, 여기서는 그것을 화면에 얹기만 한다.
 * 그림은 위키미디어에 걸어 둔 실제 지도이며, 그 위에 카드의 좌표로 자리를 찍는다.
 *
 * 망이 없어 그림을 못 받아 오면 지도 칸만 접고 좌표와 링크는 남긴다.
 * 지하철에서도 "여기가 북위 41도" 라는 것과 구글 지도로 넘어갈 길은 알 수 있어야 한다.
 */
export default function MapFigure({ pin, name }: { pin: MapPin; name: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const v = mapView(pin);
  if (!v) return null;

  const label = pin.label ?? name;

  return (
    <figure className="mb-7">
      {!failed && (
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            aspectRatio: String(v.ratio),
            // 바탕 지도의 바다와 같은 색이라, 그림이 오기 전에도 자리가 지도로 보인다.
            background: '#c7e0f0',
            boxShadow: 'inset 0 0 0 1px var(--line)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.src}
            alt={`${label} 위치`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="absolute block max-w-none"
            style={{
              width: `${v.img.size}%`,
              height: `${v.img.size}%`,
              left: `${v.img.left}%`,
              top: `${v.img.top}%`,
              opacity: loaded ? 1 : 0,
              transition: 'opacity 240ms ease',
            }}
          />

          {/* 넓은 자리는 옅은 원으로, 한 점으로 집을 수 있는 자리는 점으로 찍는다. */}
          {v.radius > 0 ? (
            <span
              className="pointer-events-none absolute block rounded-full"
              style={{
                left: `${v.x}%`,
                top: `${v.y}%`,
                width: `${v.radius * 2}%`,
                aspectRatio: '1',
                transform: 'translate(-50%, -50%)',
                background:
                  'radial-gradient(circle, rgba(178,58,46,0.34) 0%, rgba(178,58,46,0.24) 52%, rgba(178,58,46,0) 71%)',
              }}
            />
          ) : (
            <span
              className="pointer-events-none absolute block rounded-full"
              style={{
                left: `${v.x}%`,
                top: `${v.y}%`,
                width: 13,
                height: 13,
                transform: 'translate(-50%, -50%)',
                background: '#b23a2e',
                boxShadow: '0 0 0 3.5px rgba(178,58,46,0.28), 0 1px 3px rgba(0,0,0,0.45)',
              }}
            />
          )}

          {/* 이름표는 흰 바탕에 얹는다. 지도 위의 땅 색과 바다 색이 저마다라 글자만 두면 묻힌다. */}
          <span
            className="pointer-events-none absolute whitespace-nowrap rounded px-1.5 py-[3px] text-[12.5px] font-semibold"
            style={{
              left: `${v.x}%`,
              top: `${v.y}%`,
              transform: `translate(${v.flip ? 'calc(-100% - 13px)' : '13px'}, -50%)`,
              background: 'rgba(255,255,255,0.93)',
              color: '#8d2b21',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            {label}
          </span>
        </div>
      )}

      <figcaption className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <span style={{ color: 'var(--thread)' }}>어디쯤인가</span>
        {pin.note ? ` · ${pin.note}` : ''}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="tabular-nums">{v.coord}</span>
          {v.google && (
            <a
              href={v.google}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full px-2.5 py-1 text-[12px] font-medium"
              style={{ background: 'var(--thread-soft)', color: 'var(--thread)' }}
            >
              구글 지도에서 열기 →
            </a>
          )}
          <a
            href={sourcePage(v.base.file)}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11.5px] opacity-80"
          >
            지도 {v.base.author} · {v.base.license}
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
