/**
 * E2E 검증 — 빌드된 앱을 실제로 띄우고 브라우저로 확인한다.
 *
 *   npm run test:e2e
 *
 * 두 가지를 본다.
 *  1) 서버가 내려 준 HTML 에 카드 내용이 제대로 들어 있는가 (마크다운 변환, 이스케이프, 내부 링크)
 *  2) 브라우저에서 검색과 필터와 이동이 실제로 동작하는가 (DevTools Protocol)
 *
 * 헤드리스 Chrome 의 --window-size 로는 이 환경에서 뷰포트 폭이 500px 아래로 내려가지 않는다.
 * 그래서 모바일 폭 확인에는 Emulation.setDeviceMetricsOverride 를 쓴다.
 * 스크린샷은 tests/e2e/shots/ 에 남으며 git 에는 올리지 않는다.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SHOTS = join(HERE, 'shots');
const PORT = 3111;
const BASE = `http://127.0.0.1:${PORT}`;
const CDP_PORT = 9335;
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (label, extra = '') => console.log(`  OK    ${label}${extra ? '  ' + extra : ''}`);
const bad = (label, detail) => {
  fails++;
  console.log(`  FAIL  ${label}  ${detail}`);
};
function expect(label, actual, wanted) {
  String(actual) === String(wanted) ? ok(label, `(${actual})`) : bad(label, `기대 ${wanted} / 실제 ${actual}`);
}

// ── 서버 띄우기 ─────────────────────────────────────────────────────────
const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'start', '--port', String(PORT)],
  { cwd: ROOT, stdio: 'ignore', shell: process.platform === 'win32' },
);

async function waitFor(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {}
    await sleep(300);
  }
  return false;
}

function findChrome() {
  return CHROME_CANDIDATES.find((p) => existsSync(p));
}

// ── CDP 최소 클라이언트 ─────────────────────────────────────────────────
class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id === undefined) return this.events.push(m.method);
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async js(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expression);
    return r.result.value;
  }
}

const openWs = (url) =>
  new Promise((resolve, reject) => {
    const w = new WebSocket(url);
    w.addEventListener('open', () => resolve(w));
    w.addEventListener('error', reject);
  });

let chrome = null;
try {
  if (!(await waitFor(BASE + '/'))) {
    console.error('서버가 뜨지 않았습니다. npm run build 를 먼저 실행하십시오.');
    process.exit(1);
  }

  // ── 1부. 서버가 내려 준 HTML ────────────────────────────────────────
  console.log('\n[1] 서버 HTML');
  const get = async (path) => (await fetch(BASE + path)).text();

  const CHECKS = {
    '/': ['오늘 본 이름', '나이키', '판도라의 상자'],
    '/trace/nike': ['나이키', '니케', '스우시', '사모트라케', '이 이름은 어디서 왔나'],
    '/trace/pandora': ['같은 원천의 다른 흔적', '판도라의 상자'],
    '/trace/pandoras-box': ['피토스', '픽시스'],
    '/source/zeus': ['옥황상제', '여기서 나온 흔적', '목성', '한국 대응물'],
    '/source/ariadne': ['실마리', '인셉션', '아이에게', '어른에게'],
    '/source/achilles': ['트로이 목마', '역린'],
    '/source/seven-deadly-sins': ['일곱 죄악', '삼독', '세븐'],
  };
  for (const [path, probes] of Object.entries(CHECKS)) {
    const html = await get(path);
    const miss = probes.filter((p) => !html.includes(p));
    miss.length === 0 ? ok(path, `${html.length}b`) : bad(path, '없음: ' + miss.join(', '));
  }

  const achilles = await get('/source/achilles');
  // 카드 본문의 <일리아스> 같은 겹화살괄호가 태그로 먹혀 사라지면 안 된다.
  achilles.includes('&lt;일리아스&gt;')
    ? ok('겹화살괄호 이스케이프')
    : bad('겹화살괄호 이스케이프', achilles.includes('<일리아스>') ? '원시 태그' : '사라짐');
  achilles.includes('href="/trace/trojan-horse"') && achilles.includes('href="/trace/achilles-heel"')
    ? ok('[[wiki]] 링크 변환')
    : bad('[[wiki]] 링크 변환', '링크가 없음');
  (await get('/trace/david-vs-goliath')).includes('<strong>상대의 방식으로 싸우기를 거부했다.</strong>')
    ? ok('**굵게** 변환')
    : bad('**굵게** 변환', 'strong 태그가 없음');

  for (const raw of ['[[', '**']) {
    const hits = [];
    for (const path of Object.keys(CHECKS)) {
      const body = (await get(path)).split('<body')[1]?.split('<script')[0] ?? '';
      if (body.includes(raw)) hits.push(path);
    }
    hits.length === 0 ? ok(`남은 원시 마크다운 ${raw} 없음`) : bad(`원시 마크다운 ${raw}`, hits.join(', '));
  }

  // ── 2부. 브라우저 ───────────────────────────────────────────────────
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('\n[2] 브라우저 검증을 건너뜁니다 (Chrome 을 찾지 못함)');
  } else {
    console.log('\n[2] 브라우저');
    mkdirSync(SHOTS, { recursive: true });
    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--hide-scrollbars',
        `--remote-debugging-port=${CDP_PORT}`,
        '--user-data-dir=' + join(SHOTS, '_profile'),
        'about:blank',
      ],
      { stdio: 'ignore' },
    );
    if (!(await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`))) {
      bad('Chrome DevTools 연결', '열리지 않음');
    } else {
      const tab = await (
        await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })
      ).json();
      const s = new Session(await openWs(tab.webSocketDebuggerUrl));
      await s.send('Page.enable');
      await s.send('Runtime.enable');
      await s.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await s.send('Page.navigate', { url: BASE + '/' });
      for (let i = 0; i < 50 && !s.events.includes('Page.loadEventFired'); i++) await sleep(100);
      await sleep(800);

      const CARDS = 'document.querySelectorAll(\'main ul li a[href^="/trace/"], main ul li a[href^="/source/"]\').length';
      const clearSearch = `(() => {
        const el = document.querySelector('input[type=search]');
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(el, '');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      })()`;

      // 모바일 폭에서 가로로 넘치지 않아야 한다.
      const docW = await s.js('document.documentElement.scrollWidth');
      expect('모바일 390px 가로 넘침 없음', docW, 390);

      expect('첫 화면 흔적 수', await s.js(CARDS), 23);

      await s.js('document.querySelector("input[type=search]").focus()');
      await s.send('Input.insertText', { text: '판도라' });
      await sleep(400);
      expect('검색 "판도라"', await s.js(CARDS), 2);

      await s.js(clearSearch);
      await sleep(250);
      await s.js('document.querySelector("input[type=search]").focus()');
      await s.send('Input.insertText', { text: 'nasa' });
      await sleep(400);
      // domain_hint 로만 걸리는 검색. 아폴로 계획, 아르테미스 계획, 에우로파 세 개다.
      expect('검색 "nasa" (domain_hint)', await s.js(CARDS), 3);

      await s.js(clearSearch);
      await sleep(250);
      await s.js(`[...document.querySelectorAll('main button')].find(b => b.textContent.startsWith('브랜드')).click()`);
      await sleep(400);
      expect('갈래 "브랜드" 필터', await s.js(CARDS), 4);

      await s.js(`[...document.querySelectorAll('main button')].find(b => b.textContent.startsWith('원천')).click()`);
      await sleep(400);
      expect('원천 탭 (필터 초기화 포함)', await s.js(CARDS), 22);

      await s.js(`document.querySelector('main ul li a[href^="/source/"]').click()`);
      await sleep(1500);
      const moved = await s.js('location.pathname');
      String(moved).startsWith('/source/') ? ok('카드 클릭 이동', moved) : bad('카드 클릭 이동', moved);

      // 스크린샷 남기기
      for (const [name, path] of [
        ['m-home', '/'],
        ['m-trace-nike', '/trace/nike'],
        ['m-source-ariadne', '/source/ariadne'],
      ]) {
        await s.send('Page.navigate', { url: BASE + path });
        await sleep(1200);
        const m = await s.send('Page.getLayoutMetrics');
        const size = m.cssContentSize ?? m.contentSize;
        const shot = await s.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: 390, height: Math.min(size.height, 4000), scale: 1 },
        });
        writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(shot.data, 'base64'));
      }
      ok('스크린샷 3장', 'tests/e2e/shots/');
      s.ws.close();
    }
  }
} finally {
  chrome?.kill();
  server.kill();
}

console.log(`\n실패 ${fails}건`);
process.exit(fails ? 1 : 0);
