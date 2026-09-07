import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { resolve } from '../lib/graph';

/**
 * 카드 본문(마크다운 일부)을 렌더링한다.
 *
 * 라이브러리를 쓰지 않는 이유가 있다. 카드 본문에는 <일리아스>, <사모트라케의 니케> 처럼
 * 겹화살괄호로 작품명을 적는 한국어 관례가 그대로 들어 있다. 원시 HTML 을 허용하는 렌더러에 넣으면
 * 이것들이 알 수 없는 태그로 취급되어 화면에서 사라진다.
 * React 는 문자열을 자동으로 이스케이프하므로, 직접 파싱해서 노드를 만들면 이 문제가 아예 생기지 않는다.
 *
 * 지원하는 문법은 카드가 실제로 쓰는 것만이다.
 *   - 문단 (빈 줄로 구분, 문단 안의 줄바꿈은 공백으로 이어 붙인다)
 *   - `- ` 로 시작하는 목록
 *   - **굵게**
 *   - [[trace:slug]] / [[source:slug]] 내부 링크
 */

const WIKI = /\[\[((?:trace|source):[A-Za-z0-9_-]+)\]\]/g;
const BOLD = /\*\*([^*]+)\*\*/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let n = 0;

  // 먼저 위키 링크를 잘라 내고, 그 사이의 일반 텍스트에서 굵게를 처리한다.
  WIKI.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKI.exec(text)) !== null) {
    if (m.index > cursor) out.push(...bold(text.slice(cursor, m.index), `${keyPrefix}-t${n++}`));
    const id = m[1]!;
    const target = resolve(id);
    if (target) {
      out.push(
        <Link key={`${keyPrefix}-l${n++}`} href={target.href} className="thread-link">
          {target.name}
        </Link>,
      );
    } else {
      // 아직 카드가 없는 원천을 가리키는 링크. 링크로 만들지 않고 이름만 남긴다.
      out.push(
        <span key={`${keyPrefix}-x${n++}`} className="text-[var(--muted)]">
          {id.split(':')[1]}
        </span>,
      );
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) out.push(...bold(text.slice(cursor), `${keyPrefix}-t${n++}`));
  return out;
}

function bold(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let n = 0;
  BOLD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BOLD.exec(text)) !== null) {
    if (m.index > cursor) out.push(<Fragment key={`${keyPrefix}-p${n++}`}>{text.slice(cursor, m.index)}</Fragment>);
    out.push(<strong key={`${keyPrefix}-b${n++}`}>{m[1]}</strong>);
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) out.push(<Fragment key={`${keyPrefix}-p${n++}`}>{text.slice(cursor)}</Fragment>);
  return out;
}

export default function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="prose-ariadne">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        if (lines[0]!.startsWith('- ')) {
          // 목록. `- ` 로 시작하지 않는 줄은 바로 앞 항목의 이어지는 부분으로 본다.
          const items: string[] = [];
          for (const line of lines) {
            if (line.startsWith('- ')) items.push(line.slice(2));
            else if (items.length > 0) items[items.length - 1] += ' ' + line;
          }
          return (
            <ul key={bi}>
              {items.map((item, ii) => (
                <li key={ii}>{inline(item, `b${bi}i${ii}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={bi}>{inline(lines.join(' '), `b${bi}`)}</p>;
      })}
    </div>
  );
}
