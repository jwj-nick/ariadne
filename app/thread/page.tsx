import type { Metadata } from 'next';
import Link from 'next/link';
import { getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '이름의 무리',
  description: '여러 이름을 하나로 꿰는 짧은 글. 낱장으로는 보이지 않는 무리를 봅니다.',
};

/**
 * 실 목록 (D39).
 *
 * 카드를 삼백 장 읽어도 "행성 이름이 전부 로마 신" 이라는 것은 저절로 보이지 않는다.
 * 그 무리를 글로 꿰어 둔 자리다.
 */
export default function ThreadListPage() {
  const threads = getGraph().threads;

  return (
    <div>
      <h1 className="mb-1 text-[21px] font-semibold">이름의 무리</h1>
      <p className="mb-5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        카드 한 장은 이름 하나가 어디서 왔는지를 말합니다. 여기 있는 글은 그 이름들이
        <strong> 왜 한 무리인지</strong>를 말합니다. 낱장을 아무리 많이 읽어도 보이지 않는 것입니다.
      </p>

      {threads.length === 0 ? (
        <p className="py-10 text-center text-[14px]" style={{ color: 'var(--muted)' }}>
          아직 실이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/thread/${t.slug}`}
                className="block rounded-lg px-4 py-3.5"
                style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
              >
                <span className="block text-[15.5px] leading-snug font-semibold">{t.title}</span>
                <span className="mt-1 block text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {t.lede}
                </span>
                <span className="mt-1.5 block text-[11.5px]" style={{ color: 'var(--thread)' }}>
                  카드 {t.cards.length}장
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
