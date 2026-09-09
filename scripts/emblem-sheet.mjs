/**
 * 문양을 한 장에 모아 그려 눈으로 확인한다.
 *
 * 문양은 선 몇 개로 무엇인지 알아볼 수 있어야 쓸모가 있는데,
 * 좌표만 보아서는 그것이 새인지 물고기인지 알 수 없다.
 * 새 문양을 그리거나 고친 뒤에는 `npm run emblems` 로 이 장을 뽑아 눈으로 확인한다.
 *
 * Emblem.tsx 의 EMBLEMS 를 그대로 읽으므로 목록을 따로 관리하지 않는다.
 * 결과는 tests/e2e/shots/emblems.png 에 남는다.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, 'app/components/Emblem.tsx'), 'utf8');

// EMBLEMS 객체를 잘라 내 평가한다. 타입 표기만 걷어 내면 그대로 JS 다.
const start = src.indexOf('export const EMBLEMS');
const end = src.indexOf('\n};', start) + 3;
let body = src.slice(start, end).replace('export const EMBLEMS: Record<string, Shape> = ', '');
body = body.replace(/\n\};$/, '\n}');
const EMBLEMS = new Function(`return ${body}`)();

const names = Object.keys(EMBLEMS);
const COLS = 8;
const CELL = 120;
const rows = Math.ceil(names.length / COLS);

const cells = names
  .map((name, i) => {
    const cx = (i % COLS) * CELL;
    const cy = Math.floor(i / COLS) * CELL;
    const sh = EMBLEMS[name];
    const paths = (sh.d ?? []).map((d) => `<path d="${d}"/>`).join('');
    const dashed = (sh.dashed ?? []).map((d) => `<path d="${d}" stroke-dasharray="7 7"/>`).join('');
    const circles = (sh.circles ?? [])
      .map(([x, y, r, filled]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${filled ? 'currentColor' : 'none'}"/>`)
      .join('');
    return `<g transform="translate(${cx + 10} ${cy + 6}) scale(0.86)">
      <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        ${paths}${dashed}${circles}
      </g>
    </g>
    <text x="${cx + 53}" y="${cy + 106}" text-anchor="middle" font-size="11" fill="#8a8078" stroke="none">${name}</text>`;
  })
  .join('\n');

const html = `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#faf7f3;color:#9b2c2c;font-family:sans-serif">
<svg width="${COLS * CELL}" height="${rows * CELL + 10}" viewBox="0 0 ${COLS * CELL} ${rows * CELL + 10}">
${cells}
</svg></body>`;

const dir = mkdtempSync(join(tmpdir(), 'emblem-'));
const file = join(dir, 'sheet.html');
writeFileSync(file, html, 'utf8');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = join(ROOT, 'tests/e2e/shots/emblems.png');
const p = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--screenshot=${out}`,
  `--window-size=${COLS * CELL},${rows * CELL + 10}`,
  'file:///' + file.replace(/\\/g, '/'),
]);
p.on('exit', (code) => {
  console.log(`문양 ${names.length}종 → ${out} (exit ${code})`);
});
