'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dueQueue, initialState, progress, today } from '../lib/learning/sm2';
import { store } from '../lib/store';
import LabyrinthProgress from './LabyrinthProgress';

/**
 * 홈 맨 위의 "오늘 할 일" 줄과 미궁 진도 (D27-D).
 *
 * 이 앱의 성공 조건은 카드 수가 아니라 **매일 돌아오는가**이다.
 * 그래서 첫 화면에서 오늘 볼 복습과 아직 처리하지 않은 캡처를 바로 보여 주고,
 * 얼마나 왔는지를 미궁 그림으로 함께 보여 준다.
 *
 * 숫자는 브라우저에만 있으므로 처음 그릴 때는 0 이고, 붙고 나서 채워진다.
 * 자리는 미리 잡아 두어 화면이 덜컥 움직이지 않게 한다.
 */
export default function TodayStrip({ traceIds }: { traceIds: string[] }) {
  const total = traceIds.length;
  const [ready, setReady] = useState(false);
  const [due, setDue] = useState(0);
  const [openCaptures, setOpenCaptures] = useState(0);
  const [stats, setStats] = useState({ seen: 0, settled: 0 });

  useEffect(() => {
    const day = today();
    const saved = new Map(store.allReviews().map((r) => [r.itemId, r]));
    const states = traceIds.map((id) => saved.get(id) ?? initialState(id, day));
    setDue(dueQueue(states, day).length);
    const p = progress(states, total, day);
    setStats({ seen: p.seen, settled: p.settled });
    setOpenCaptures(store.allCaptures().filter((c) => c.status === 'open').length);
    setReady(true);
  }, [traceIds, total]);

  const box = { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' } as const;
  const num = (n: number) => (ready ? `${n}개` : ' ');

  return (
    <div className="mb-6 flex gap-2">
      <Link
        href="/settings"
        className="flex shrink-0 flex-col items-center justify-center rounded-lg px-3 py-2.5"
        style={box}
        aria-label="진도 보기"
      >
        <LabyrinthProgress seen={stats.seen} settled={stats.settled} total={total} size={82} />
        <span className="mt-1 text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>
          {ready ? `${stats.seen} / ${total}` : ' '}
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link href="/quiz" className="flex-1 rounded-lg px-3.5 py-2.5" style={box}>
          <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>
            오늘 볼 복습
          </span>
          <span className="mt-0.5 block text-[17px] font-semibold" style={{ color: 'var(--thread)' }}>
            {num(due)}
          </span>
        </Link>
        <Link href="/capture" className="flex-1 rounded-lg px-3.5 py-2.5" style={box}>
          <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>
            담아 둔 조우
          </span>
          <span
            className="mt-0.5 block text-[17px] font-semibold"
            style={{ color: openCaptures > 0 ? 'var(--thread)' : 'var(--muted)' }}
          >
            {num(openCaptures)}
          </span>
        </Link>
      </div>
    </div>
  );
}
