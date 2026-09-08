'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { store, type Wish } from '../lib/store';

/**
 * 카드 화면에서 "더 알고 싶다"를 담는 버튼 (D28).
 *
 * 이 앱은 정적이라 카드를 스스로 늘리지 못한다. 그래서 관심을 표시하면 그 자리에 담아 두었다가,
 * 요청서 화면에서 개발 도구에 붙여 넣을 수 있는 글 한 장으로 모아 준다.
 *
 * 담는 순간에 메모를 함께 받는 것이 중요하다. 나중에 요청서를 만들 때
 * 무엇이 궁금했는지 떠올리지 못하면 요청이 막연해진다.
 */
export default function WishButton({
  kind,
  id,
  label,
}: {
  kind: 'trace' | 'source';
  id: string;
  label: string;
}) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<Wish | null>(null);

  useEffect(() => {
    setSaved(store.allWishes().find((w) => w.origin.id === id) ?? null);
    setReady(true);
  }, [id]);

  const add = () => {
    const wish: Wish = {
      id: `wish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: label,
      origin: { kind, id, label },
      note: note.trim(),
      at: new Date().toISOString(),
    };
    store.addWish(wish);
    setSaved(wish);
    setOpen(false);
    setNote('');
  };

  const drop = () => {
    if (saved) store.removeWish(saved.id);
    setSaved(null);
  };

  const box = { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' } as const;

  // 준비 전에는 자리만 잡아 둔다. 담긴 것을 모르는 채로 "담기"를 보여 주면 잘못된 안내가 된다.
  if (!ready) return <div className="mb-7 h-[52px]" />;

  if (saved) {
    return (
      <section className="mb-7 rounded-lg p-3.5" style={{ background: 'var(--thread-soft)' }}>
        <p className="text-[13.5px]" style={{ color: 'var(--thread)' }}>
          요청서에 담아 두었습니다.
          {saved.note && <span className="ml-1" style={{ color: 'var(--muted)' }}>“{saved.note}”</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
          <Link href="/request" className="thread-link">
            요청서 보기
          </Link>
          <button type="button" onClick={drop} style={{ color: 'var(--muted)' }}>
            빼기
          </button>
        </div>
      </section>
    );
  }

  if (!open) {
    return (
      <section className="mb-7">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg px-4 py-3 text-left text-[14px]"
          style={box}
        >
          <span className="font-semibold" style={{ color: 'var(--thread)' }}>
            이것에 대해 더 알고 싶습니다
          </span>
          <span className="mt-0.5 block text-[12.5px]" style={{ color: 'var(--muted)' }}>
            담아 두면 카드를 더 만들어 달라는 요청서로 뽑아 줍니다
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="mb-7 rounded-lg p-3.5" style={box}>
      <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
        무엇이 궁금하신지 한 줄로 적어 두십시오. 비워 두어도 됩니다.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        autoFocus
        placeholder={`예: ${label}와 얽힌 다른 이야기도 보고 싶습니다`}
        className="mt-2 w-full rounded-lg p-3 text-[14.5px] outline-none"
        style={{ background: 'var(--bg)', boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--ink)' }}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={add}
          className="rounded-lg px-4 py-2 text-[14px]"
          style={{ background: 'var(--thread)', color: '#fff' }}
        >
          담기
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setNote('');
          }}
          className="rounded-lg px-4 py-2 text-[14px]"
          style={{ color: 'var(--muted)' }}
        >
          그만두기
        </button>
      </div>
    </section>
  );
}
