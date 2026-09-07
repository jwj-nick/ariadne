import Prose from './Prose';

/** 카드 본문의 한 섹션. 왼쪽의 가는 세로선이 실 한 가닥을 뜻한다. */
export default function Section({ title, text }: { title: string; text?: string }) {
  if (!text || text.trim() === '') return null;
  return (
    <section className="relative thread-rail mb-7">
      <h2 className="mb-2 text-[12px] tracking-wide" style={{ color: 'var(--muted)' }}>
        {title}
      </h2>
      <div className="text-[15px]">
        <Prose text={text} />
      </div>
    </section>
  );
}
