/**
 * 카드에 걸어 둔 그림이 실제로 살아 있는지 확인한다.
 *
 *   npm run images
 *
 * 그림은 리포에 두지 않고 위키미디어에 걸어 두었다 (D29).
 * 그러면 용량은 들지 않지만 저쪽 사정으로 끊길 수 있다.
 * 파일 이름이 바뀌거나 지워지면 화면에서 조용히 사라지므로, 이 명령으로 따로 본다.
 *
 * 망을 타므로 `npm run check` 에 넣지 않았다. 그림을 새로 걸었을 때와 가끔 돌린다.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAPH = join(ROOT, 'app', 'data', 'graph.json');

if (!existsSync(GRAPH)) {
  console.error('app/data/graph.json 이 없습니다. npm run build:content 를 먼저 실행하십시오.');
  process.exit(1);
}

const g = JSON.parse(readFileSync(GRAPH, 'utf8'));
const cards = [...g.traces, ...g.sources].filter((c) => c.image?.file);

if (cards.length === 0) {
  console.log('\n  그림을 걸어 둔 카드가 없습니다.\n');
  process.exit(0);
}

const UA = 'ariadne/0.1 (https://github.com/jwj-nick/ariadne)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log('');
console.log('  Ariadne 그림 확인');
console.log('  ─────────────────────────────────────────────');
console.log(`  걸어 둔 그림 ${cards.length}장`);
console.log('');

let bad = 0;
let bytes = 0;
for (const c of cards) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.image.file)}?width=900`;
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const buf = Buffer.from(await r.arrayBuffer());
    const ms = Date.now() - t0;
    const type = r.headers.get('content-type') ?? '';
    // 없는 파일도 200 대신 404 를 주지만, 오류 페이지를 그림인 척 주는 경우도 있어 형식을 함께 본다.
    const isImage = /^image\//.test(type);
    if (!r.ok || !isImage) {
      bad += 1;
      console.log(`  FAIL  ${c.id}`);
      console.log(`        ${c.image.file}`);
      console.log(`        HTTP ${r.status} · ${type}`);
    } else {
      bytes += buf.length;
      console.log(`  OK    ${c.id.padEnd(30)} ${String(Math.round(buf.length / 1024)).padStart(4)}KB ${String(ms).padStart(5)}ms`);
    }
  } catch (e) {
    bad += 1;
    console.log(`  FAIL  ${c.id}  ${e.message}`);
  }
  // 위키미디어에 몰아치지 않는다.
  await sleep(120);
}

const okCount = cards.length - bad;
console.log('');
console.log(`  살아 있는 그림 ${okCount}장 · 끊긴 것 ${bad}장`);
if (okCount > 0) {
  console.log(`  평균 ${Math.round(bytes / okCount / 1024)}KB (900px 기준). 리포 용량은 0 이다.`);
}
console.log('');
process.exit(bad ? 1 : 0);
