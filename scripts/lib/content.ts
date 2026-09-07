/**
 * content/ 아래의 마크다운 카드를 읽어 들이는 계층.
 * 파싱만 담당하고 판정은 하지 않는다. 판정은 scripts/lib/checks.ts 가 한다.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { AnyFrontmatter } from './schema.ts';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = join(REPO_ROOT, 'content');

export interface Card {
  /** 리포 루트 기준 상대 경로. 항상 슬래시 구분자를 쓴다. */
  path: string;
  /** 파일명에서 확장자를 뺀 것 */
  slug: string;
  /** traces | sources | candidates */
  bucket: 'traces' | 'sources' | 'candidates';
  /** 버킷 바로 아래 폴더 이름. trace 면 category, source 면 domain 이어야 한다. */
  folder: string;
  data: Partial<AnyFrontmatter> & Record<string, unknown>;
  body: string;
  /** 마크다운 `## ` 제목을 등장 순서대로 뽑은 것 */
  headings: string[];
  raw: string;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

function extractHeadings(body: string): string[] {
  const out: string[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    // `### ` 이하는 자유롭게 쓸 수 있으므로 `## ` 만 본다.
    if (m && !line.startsWith('###')) out.push(m[1]!.replace(/^\d+\.\s*/, '').trim());
  }
  return out;
}

export function loadCards(buckets: Array<Card['bucket']> = ['traces', 'sources']): Card[] {
  const cards: Card[] = [];
  for (const bucket of buckets) {
    const dir = join(CONTENT_DIR, bucket);
    for (const file of walk(dir)) {
      const raw = readFileSync(file, 'utf8');
      const parsed = matter(raw);
      const rel = relative(REPO_ROOT, file).split(sep).join('/');
      const inner = relative(join(CONTENT_DIR, bucket), file).split(sep);
      cards.push({
        path: rel,
        slug: basename(file, '.md'),
        bucket,
        folder: inner.length > 1 ? inner[0]! : '',
        data: parsed.data as Card['data'],
        body: parsed.content,
        headings: extractHeadings(parsed.content),
        raw,
      });
    }
  }
  return cards.sort((a, b) => a.path.localeCompare(b.path));
}

export const isTrace = (c: Card) => c.data.type === 'trace';
export const isSource = (c: Card) => c.data.type === 'source';
