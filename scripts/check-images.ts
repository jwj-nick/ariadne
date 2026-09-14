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
 *
 * 별자리의 옛 성도와 바탕 지도는 코드에 적혀 있어서 graph.json 에 없다.
 * 그래서 이 파일은 앱 쪽 모듈을 직접 읽는다. tsx 로 돌리는 이유가 그것이다.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAP_BASES } from '../app/lib/map.ts';
import { SHAPES } from '../app/components/Constellation.tsx';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAPH = join(ROOT, 'app', 'data', 'graph.json');

if (!existsSync(GRAPH)) {
  console.error('app/data/graph.json 이 없습니다. npm run build:content 를 먼저 실행하십시오.');
  process.exit(1);
}

const g = JSON.parse(readFileSync(GRAPH, 'utf8'));

/**
 * 확인할 그림을 모두 모은다.
 *
 * 카드의 대표 그림(image) 말고도 곁들이는 그림(figures, D49), 별자리마다 붙은 옛 성도,
 * 지명에 까는 바탕 지도(D48)가 있다. 뒤의 둘은 콘텐츠가 아니라 코드에 적혀 있어서
 * graph.json 에 없다. 그러나 끊기면 화면에서 조용히 사라지는 것은 똑같으므로 함께 본다.
 */
const cards: Array<{ id: string; file: string }> = [];
for (const c of [...g.traces, ...g.sources]) {
  if (c.image?.file) cards.push({ id: c.id, file: c.image.file });
  for (const [i, f] of (c.figures ?? []).entries()) {
    if (f?.file) cards.push({ id: `${c.id} figures[${i}]`, file: f.file });
  }
}
// 코드에 적힌 그림. 같은 파일을 여러 카드가 함께 쓰므로 한 번만 본다.
for (const [name, shape] of Object.entries(SHAPES)) {
  if (shape.atlas?.file) cards.push({ id: `별자리 ${name}`, file: shape.atlas.file });
}
for (const [name, base] of Object.entries(MAP_BASES)) {
  cards.push({ id: `바탕 지도 ${name}`, file: base.file });
}

if (cards.length === 0) {
  console.log('\n  그림을 걸어 둔 카드가 없습니다.\n');
  process.exit(0);
}

const UA = 'ariadne/0.1 (https://github.com/jwj-nick/ariadne)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log('');
console.log('  Ariadne 그림 확인');
console.log('  ─────────────────────────────────────────────');
console.log(`  걸어 둔 그림 ${cards.length}장`);
console.log('');

let bad = 0;
let bytes = 0;
for (const c of cards) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.file)}?width=900`;
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
      console.log(`        ${c.file}`);
      console.log(`        HTTP ${r.status} · ${type}`);
    } else {
      bytes += buf.length;
      console.log(`  OK    ${c.id.padEnd(34)} ${String(Math.round(buf.length / 1024)).padStart(4)}KB ${String(ms).padStart(5)}ms`);
    }
  } catch (e) {
    bad += 1;
    console.log(`  FAIL  ${c.id}  ${e instanceof Error ? e.message : String(e)}`);
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
