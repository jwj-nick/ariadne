'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dueQueue, initialState, today } from '../lib/learning/sm2';
import { store } from '../lib/store';

/**
 * 홈 맨 위의 "오늘 할 일" 줄.
 *
 * 이 앱의 성공 조건은 카드 수가 아니라 **매일 돌아오는가**이다.
 * 그래서 첫 화면에서 오늘 볼 복습과 아직 처리하지 않은 캡처를 바로 보여 준다.
 *
 * 숫자는 브라우저에만 있으므로 처음 그릴 때는 비어 있고, 붙고 나서 채워진다.
 * 자리는 미리 잡아 두어 화면이 덜컥 움직이지 않게 한다.
 */
export default function TodayStrip({ traceIds }: { traceIds: string[] }) {
  const [due, setDue] = useState<number | null>(null);
  const [openCaptures, setOpenCaptures] = useState<number | null>(null);

  useEffect(() => {
    const day = today();
    const saved = new Map(store.allReviews().map((r) => [r.itemId, r]));
    const states = traceIds.map((id) => saved.get(id) ?? initialState(id, day));
    setDue(dueQueue(states, day).length);
    setOpenCaptures(store.allCaptures().filter((c) => c.status === 'open').length);
  }, [traceIds]);

  const chip = {
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--line)',
  } as const;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Link href="/quiz" className="flex-1 rounded-lg px-3.5 py-3" style={chip}>
        <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>
          오늘 볼 복습
        </span>
        <span className="mt-0.5 block text-[17px] font-semibold" style={{ color: 'var(--thread)' }}>
          {due === null ? ' ' : `${due}개`}
        </span>
      </Link>
      <Link href="/capture" className="flex-1 rounded-lg px-3.5 py-3" style={chip}>
        <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>
          담아 둔 조우
        </span>
        <span
          className="mt-0.5 block text-[17px] font-semibold"
          style={{ color: openCaptures ? 'var(--thread)' : 'var(--muted)' }}
        >
          {openCaptures === null ? ' ' : `${openCaptures}개`}
        </span>
      </Link>
    </div>
  );
}
