'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dueQueue, initialState, progress, today } from '../lib/learning/sm2';
import { store } from '../lib/store';
import LabyrinthProgress from './LabyrinthProgress';
import { SESSION_CAP } from './QuizRunner';

/**
 * 홈 맨 위의 "오늘 할 일" (D27-D, D34 에서 다시 손봄).
 *
 * 이 앱의 성공 조건은 카드 수가 아니라 **매일 돌아오는가**이다.
 * 그래서 홈에 들어오면 가장 먼저 오늘 풀 퀴즈가 몇 개인지 보이고,
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

  return (
    <div className="mb-5">
      <Link
        href="/quiz"
        className="flex items-center gap-3.5 rounded-xl px-4 py-3.5"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      >
        <LabyrinthProgress seen={stats.seen} settled={stats.settled} total={total} size={62} />
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold">오늘의 퀴즈</span>
          <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--muted)' }}>
            {ready ? (
              stats.seen === 0 ? (
                '처음이라면 여기서 시작하십시오'
              ) : due > 0 ? (
                <>
                  이번 판에{' '}
                  <strong style={{ color: 'var(--thread)' }}>{Math.min(due, SESSION_CAP)}개</strong>
                  가 준비되어 있습니다
                </>
              ) : (
                '오늘 차례는 끝났습니다. 더 풀어도 됩니다'
              )
            ) : (
              ' '
            )}
          </span>
          <span className="mt-0.5 block text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>
            {ready ? `${total}개 가운데 ${stats.seen}개를 보았습니다` : ' '}
          </span>
        </span>
        <span className="shrink-0 text-[15px]" style={{ color: 'var(--muted)' }}>
          →
        </span>
      </Link>

      {/* 담아 둔 것이 남아 있을 때만 알린다. 0 을 늘 보여 주면 자리만 먹는다. */}
      {ready && openCaptures > 0 && (
        <Link
          href="/capture"
          className="mt-2 flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px]"
          style={{ background: 'var(--thread-soft)', color: 'var(--thread)' }}
        >
          담아 두고 아직 안 본 것 {openCaptures}개
          <span className="ml-auto">→</span>
        </Link>
      )}
    </div>
  );
}
