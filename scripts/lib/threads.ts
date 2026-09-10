/**
 * 실(thread) — 여러 카드를 하나로 꿰는 짧은 글 (D39).
 *
 * 카드는 낱장이라 "이 이름이 어디서 왔나" 까지만 답한다. 그런데 미션이 말하는
 * "서양 지식인 수준의 교양" 은 낱장의 합이 아니라 **무리를 알아보는 눈**이다.
 * 행성 이름이 전부 로마 신이라는 것, 주기율표에 신들이 줄지어 있다는 것은
 * 카드를 삼백 장 읽어도 저절로 보이지 않는다. 그래서 글로 꿴다.
 *
 * 카드와 달리 실은 오너가 직접 쓴다. 자동 생성하지 않는다.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { CONTENT_DIR } from './content.ts';

export interface Thread {
  id: string;
  slug: string;
  title: string;
  lede: string;
  kicker: string;
  /** 이 실이 꿰는 카드 id 들. 화면 아래에 격자로 깔린다. */
  cards: string[];
  status: string;
  body: string;
}

export const THREADS_DIR = join(CONTENT_DIR, 'threads');

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export function loadThreads(): Thread[] {
  if (!existsSync(THREADS_DIR)) return [];
  const out: Thread[] = [];
  for (const entry of readdirSync(THREADS_DIR).sort()) {
    if (!entry.endsWith('.md')) continue;
    const raw = readFileSync(join(THREADS_DIR, entry), 'utf8');
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    out.push({
      id: str(d.id),
      slug: str(d.slug, entry.replace(/\.md$/, '')),
      title: str(d.title),
      lede: str(d.lede),
      kicker: str(d.kicker, '이름의 무리'),
      cards: Array.isArray(d.cards) ? d.cards.map(String) : [],
      status: str(d.status, 'candidate'),
      body: content.trim(),
    });
  }
  return out;
}

export interface ThreadFinding {
  slug: string;
  message: string;
}

const WIKI = /\[\[((?:trace|source):[A-Za-z0-9_-]+)\]\]/g;

/**
 * 실이 가리키는 카드가 실제로 있는지 본다.
 *
 * 카드를 지우거나 slug 를 바꾸면 실의 링크가 조용히 끊긴다. 화면에서는 그냥 글자로 보이므로
 * 눈으로는 알아채기 어렵다. 그래서 빌드에서 잡는다.
 */
export function checkThreads(threads: Thread[], knownIds: Set<string>): ThreadFinding[] {
  const out: ThreadFinding[] = [];
  const seen = new Set<string>();
  for (const t of threads) {
    if (!t.id) out.push({ slug: t.slug, message: 'id 가 없습니다.' });
    if (!t.title) out.push({ slug: t.slug, message: 'title 이 없습니다.' });
    if (!t.lede) out.push({ slug: t.slug, message: 'lede 가 없습니다.' });
    if (seen.has(t.id)) out.push({ slug: t.slug, message: `id 가 겹칩니다: ${t.id}` });
    seen.add(t.id);
    if (t.cards.length < 3) {
      out.push({ slug: t.slug, message: `꿰는 카드가 ${t.cards.length}장뿐입니다. 셋은 있어야 실이 됩니다.` });
    }
    for (const id of t.cards) {
      if (!knownIds.has(id)) out.push({ slug: t.slug, message: `cards 의 "${id}" 를 찾을 수 없습니다.` });
    }
    WIKI.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKI.exec(t.body)) !== null) {
      const id = m[1]!;
      if (!knownIds.has(id)) out.push({ slug: t.slug, message: `본문의 [[${id}]] 를 찾을 수 없습니다.` });
    }
  }
  return out;
}
