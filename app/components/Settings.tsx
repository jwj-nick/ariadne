'use client';

import { useEffect, useRef, useState } from 'react';
import { progress } from '../lib/learning/sm2';
import { store, type Level } from '../lib/store';
import LabyrinthProgress from './LabyrinthProgress';

/**
 * 진도 확인과 백업.
 *
 * 지금 학습 기록은 이 브라우저 안에만 있다 (D14). 방문 기록을 지우거나 기기를 바꾸면 사라진다.
 * Supabase 로 옮기기 전까지는 사용자가 직접 챙길 수 있어야 하므로 내보내기와 되돌리기를 둔다.
 */
export default function Settings({ totalTraces }: { totalTraces: number }) {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<Level>('adult');
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ seen: 0, due: 0, settled: 0, total: 0 });
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    const p = store.getProfile();
    setLevel(p.level);
    setName(p.name);
    setStats(progress(store.allReviews(), totalTraces));
  };

  useEffect(() => {
    refresh();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseLevel = (next: Level) => {
    store.setProfile({ level: next });
    document.documentElement.dataset.level = next;
    window.dispatchEvent(new CustomEvent<Level>('ariadne:level', { detail: next }));
    setLevel(next);
  };

  const download = () => {
    const snap = store.exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ariadne-backup-${snap.exported_at.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('백업 파일을 내려받았습니다.');
  };

  const upload = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = store.importSnapshot(parsed);
      if (result.ok) {
        refresh();
        setMessage('되돌렸습니다. 진도가 백업 시점으로 바뀌었습니다.');
        const p = store.getProfile();
        document.documentElement.dataset.level = p.level;
        window.dispatchEvent(new CustomEvent<Level>('ariadne:level', { detail: p.level }));
      } else {
        setMessage(`되돌리지 못했습니다. ${result.reason}`);
      }
    } catch {
      setMessage('되돌리지 못했습니다. JSON 파일이 아닌 것 같습니다.');
    }
  };

  const wipe = () => {
    store.reset();
    refresh();
    setMessage('학습 기록을 모두 지웠습니다.');
  };

  // 준비 전에도 뼈대는 그린다. 아무 것도 안 그리면 첫 화면이 잠깐 비어 보인다.
  // 처음 그릴 때의 값은 useState 의 초깃값과 같으므로 하이드레이션이 어긋나지 않는다.
  const box = { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' } as const;

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          진도
        </h2>
        <div className="flex items-center gap-4 rounded-lg p-4" style={box}>
          <div className="shrink-0">
            <LabyrinthProgress seen={stats.seen} settled={stats.settled} total={totalTraces} size={104} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">
              흔적 {ready ? stats.total : totalTraces}개 가운데 <strong>{stats.seen}개</strong>를 한 번 이상 보았고,
              그 가운데 <strong>{stats.settled}개</strong>는 복습 간격이 3주를 넘었습니다.
            </p>
            <p className="mt-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>
              오늘 볼 것 {stats.due}개
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              미궁 그림은 바깥에서 가운데로 감깁니다. 옅은 실이 한 번이라도 본 것,
              진한 실이 자리 잡은 것입니다.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          눈높이
        </h2>
        <div className="flex gap-2">
          {(
            [
              ['kid', '아이', '짧은 설명과 세 개짜리 객관식'],
              ['adult', '어른', '자세한 설명과 직접 답하기'],
            ] as const
          ).map(([key, label, desc]) => (
            <button
              key={key}
              type="button"
              onClick={() => chooseLevel(key)}
              className="flex-1 rounded-lg p-3 text-left"
              style={
                level === key
                  ? { background: 'var(--thread-soft)', boxShadow: 'inset 0 0 0 1px var(--thread)' }
                  : box
              }
            >
              <span className="text-[15px] font-semibold" style={{ color: level === key ? 'var(--thread)' : undefined }}>
                {label}
              </span>
              <span className="mt-0.5 block text-[12.5px]" style={{ color: 'var(--muted)' }}>
                {desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          이름 (이 기기에만 남습니다)
        </h2>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            store.setProfile({ name: e.target.value });
          }}
          placeholder="예: 아빠, 세은"
          className="w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
          style={{ ...box, color: 'var(--ink)' }}
        />
      </section>

      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          백업
        </h2>
        <p className="mb-3 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          학습 기록은 지금 이 브라우저 안에만 있습니다. 방문 기록을 지우거나 기기를 바꾸면 사라지므로,
          가끔 백업 파일을 내려받아 두십시오. 계정으로 기기 사이를 잇는 기능은 나중에 붙습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-lg px-4 py-2.5 text-[14px]"
            style={{ background: 'var(--thread)', color: '#fff' }}
          >
            백업 내려받기
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg px-4 py-2.5 text-[14px]"
            style={box}
          >
            백업으로 되돌리기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={wipe}
            className="rounded-lg px-4 py-2.5 text-[14px]"
            style={{ color: 'var(--muted)' }}
          >
            기록 지우기
          </button>
        </div>
        {message && (
          <p className="mt-3 text-[13.5px]" style={{ color: 'var(--thread)' }}>
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
