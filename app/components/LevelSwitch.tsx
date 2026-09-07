'use client';

import { useEffect, useState } from 'react';
import { store, type Level } from '../lib/store';

/**
 * 아이 눈높이와 어른 눈높이를 오간다 (D8, M1-5).
 *
 * 고른 값을 `<html data-level>` 에 적어 두면 서버에서 렌더링된 카드도 CSS 만으로 알맞은 쪽을 보여 준다.
 * 그래서 카드 페이지는 서버 컴포넌트로 남을 수 있고, 정적 배포에서도 그대로 돈다.
 * 화면이 잠깐 다른 눈높이로 번쩍이지 않도록 첫 값은 layout 의 인라인 스크립트가 미리 심는다.
 */
export default function LevelSwitch() {
  const [level, setLevel] = useState<Level>('adult');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLevel(store.getProfile().level);
    setReady(true);
  }, []);

  const choose = (next: Level) => {
    setLevel(next);
    store.setProfile({ level: next });
    document.documentElement.dataset.level = next;
    // 퀴즈 화면처럼 이미 떠 있는 클라이언트 화면도 같이 바뀌게 알린다.
    window.dispatchEvent(new CustomEvent<Level>('ariadne:level', { detail: next }));
  };

  return (
    <div
      className="flex overflow-hidden rounded-full text-[11.5px]"
      style={{ boxShadow: 'inset 0 0 0 1px var(--line)', visibility: ready ? 'visible' : 'hidden' }}
      aria-label="눈높이"
    >
      {(
        [
          ['kid', '아이'],
          ['adult', '어른'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => choose(key)}
          aria-pressed={level === key}
          className="px-2.5 py-1"
          style={
            level === key
              ? { background: 'var(--thread)', color: '#fff' }
              : { color: 'var(--muted)' }
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
