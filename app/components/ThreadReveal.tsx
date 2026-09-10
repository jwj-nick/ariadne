'use client';

import Emblem from './Emblem';

/**
 * 답을 열 때 흔적에서 원천으로 실이 그려지는 장면 (D27-B).
 *
 * 이 앱의 이름이자 은유가 그대로 눈에 보이는 자리다.
 * 답을 글로 알려 주는 것과, 실이 이어지는 것을 보는 것은 남는 정도가 다르다.
 *
 * 실은 `stroke-dasharray` 를 선 길이만큼 잡아 두고 `stroke-dashoffset` 을 0 으로 옮겨 그린다.
 * 문양과 원천 이름은 실이 도착한 뒤에 나타난다.
 * 움직임을 원하지 않는 설정(prefers-reduced-motion)에서는 애니메이션 없이 곧바로 보인다.
 */
export default function ThreadReveal({
  traceName,
  sourceName,
  emblem,
}: {
  traceName: string;
  sourceName: string;
  emblem: string;
}) {
  return (
    <div className="thread-reveal mb-4 flex flex-col items-center">
      <span className="text-[11px] tracking-wide" style={{ color: 'var(--muted)' }}>
        이름
      </span>
      <span className="mt-0.5 text-[16px] font-semibold">{traceName}</span>

      <svg
        viewBox="0 0 120 84"
        width="120"
        height="84"
        fill="none"
        aria-hidden="true"
        style={{ color: 'var(--thread)' }}
      >
        {/* 실이 지나갈 자리. 아주 옅게 깔아 두면 그려지는 동안 방향이 보인다. */}
        <path
          d="M60 4 C 60 26, 34 34, 42 52 C 48 66, 72 66, 78 52 C 84 38, 60 32, 60 80"
          stroke="var(--line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          className="thread-draw"
          d="M60 4 C 60 26, 34 34, 42 52 C 48 66, 72 66, 78 52 C 84 38, 60 32, 60 80"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle className="thread-bead" cx="60" cy="80" r="4" fill="currentColor" />
      </svg>

      <div className="thread-target flex flex-col items-center">
        <div style={{ color: 'var(--thread)' }}>
          <Emblem name={emblem} size={56} strokeWidth={5} />
        </div>
        <span className="mt-1 text-[11px] tracking-wide" style={{ color: 'var(--muted)' }}>
          이야기
        </span>
        <span className="mt-0.5 text-[19px] font-semibold" style={{ color: 'var(--thread)' }}>
          {sourceName}
        </span>
      </div>
    </div>
  );
}
