'use client';

import { useState } from 'react';

/**
 * 카드에 실린 그림 (D29).
 *
 * 그림 파일을 리포에 두지 않고 위키미디어에 걸어 둔 것을 그대로 불러 온다.
 * 회화·조각 서른 장이면 이삼 메가바이트인데, 그것을 리포에 넣으면
 * 콘텐츠가 늘어날수록 감당이 어려워지고 저작권 표시도 손으로 챙겨야 한다.
 * 위키미디어는 파일 이름만으로 부를 수 있는 주소를 내주고, 폭도 지정할 수 있다.
 *
 * 대신 두 가지를 감수한다.
 *  - 망이 없으면 그림이 안 보인다. 글은 그대로 보이므로 카드가 못 쓰게 되지는 않는다.
 *  - 저쪽에서 파일 이름이 바뀌면 깨진다. 그래서 `npm run images` 로 따로 확인한다.
 *
 * 저작권 표시는 규칙이 아니라 예의의 문제이기도 하다.
 * 퍼블릭 도메인이든 아니든 누가 만들고 어디서 왔는지를 그림 아래 적는다.
 */
export default function Artwork({
  file,
  caption,
  license,
}: {
  file: string;
  caption: string;
  license: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 파일 이름만으로 부를 수 있는 주소다. 해시 경로를 몰라도 되고, 저쪽에서 옮겨도 따라간다.
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
  const page = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

  // 못 불러 왔으면 자리까지 통째로 감춘다. 깨진 그림 표시가 남는 것보다 낫다.
  if (failed) return null;

  return (
    <figure className="mb-7">
      <div
        className="overflow-hidden rounded-lg"
        style={{
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1px var(--line)',
          // 도착하기 전에도 자리를 잡아 두어야 글이 아래로 밀리지 않는다.
          minHeight: loaded ? undefined : 180,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="block h-auto w-full"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 240ms ease' }}
        />
      </div>
      {/* 설명과 저작권을 한 줄에 이으면 줄 끝에서 링크가 갈라져 읽기 나쁘다. */}
      <figcaption className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <span className="block">{caption}</span>
        <a
          href={page}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-0.5 inline-block text-[11.5px] opacity-80"
        >
          위키미디어 공용 · {license}
        </a>
      </figcaption>
    </figure>
  );
}
