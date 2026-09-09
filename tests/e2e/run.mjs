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
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
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

// 기대하는 개수는 빌드 산출물에서 읽는다. 카드가 늘어날 때마다 테스트를 고치지 않아도 되게 하기 위해서다.
const GRAPH = JSON.parse(readFileSync(join(ROOT, 'app', 'data', 'graph.json'), 'utf8'));
const N_TRACE = GRAPH.traces.length;

/** 홈 화면 검색이 무엇을 걸러 내는지 여기서 미리 계산한다.
 *  콘텐츠가 늘어날 때마다 기대 숫자를 손으로 고치지 않기 위해서다.
 *  app/page.tsx 의 필터와 같은 기준으로 센다. */
const searchHits = (q) => {
  const needle = q.toLowerCase();
  return GRAPH.traces.filter((t) =>
    [t.name_ko, t.name_en, t.why, ...(t.domain_hint ?? [])].some((x) =>
      String(x).toLowerCase().includes(needle),
    ),
  ).length;
};
const N_SOURCE = GRAPH.sources.length;
const N_BRAND = GRAPH.traces.filter((t) => t.category === 'brand').length;

let fails = 0;
const ok = (label, extra = '') => console.log(`  OK    ${label}${extra ? '  ' + extra : ''}`);
const bad = (label, detail) => {
  fails++;
  console.log(`  FAIL  ${label}  ${detail}`);
};
function expect(label, actual, wanted) {
  String(actual) === String(wanted) ? ok(label, `(${actual})`) : bad(label, `기대 ${wanted} / 실제 ${actual}`);
}

// ── 남은 프로세스 정리 ──────────────────────────────────────────────────
// Windows 에서 spawn 한 npx.cmd 는 kill 해도 그 아래 node 가 살아남는다.
// 지난 실행이 남긴 서버가 포트를 쥐고 있으면 **옛 빌드를 검사하게 되어** 엉뚱한 실패가 난다.
// 실제로 그 일이 있었으므로, 시작 전에 포트를 비우고 끝날 때 프로세스 나무째 정리한다.
function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const pids = new Set(out.trim().split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()));
      for (const pid of pids) {
        if (pid && /^\d+$/.test(pid)) execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
      }
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    }
  } catch {
    // 쥐고 있는 프로세스가 없으면 명령이 실패한다. 정상이다.
  }
}

function killTree(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: 'ignore' });
    else child.kill('SIGKILL');
  } catch {
    // 이미 끝난 경우다.
  }
}

killPort(PORT);
killPort(CDP_PORT);

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
  // 지금 빌드에 있는 경로가 전부 응답하는지 먼저 본다.
  // 하나라도 404 면 옛 빌드가 응답하고 있다는 뜻이므로 여기서 멈춘다.
  for (const path of ['/', '/quiz', '/trace/nike', '/source/zeus']) {
    const r = await fetch(BASE + path);
    if (!r.ok) {
      console.error(`${path} 가 HTTP ${r.status} 입니다. 옛 빌드가 응답하고 있을 수 있습니다.`);
      process.exit(1);
    }
  }

  // ── 1부. 서버가 내려 준 HTML ────────────────────────────────────────
  console.log('\n[1] 서버 HTML');
  const get = async (path) => (await fetch(BASE + path)).text();

  const CHECKS = {
    '/': ['오늘 본 이름', '나이키', '판도라의 상자', '오늘 볼 복습', '담아 둔 조우'],
    '/graph': ['실 지도', '그리스·로마 신화', '전체 보기'],
    '/trace/nike': ['나이키', '니케', '스우시', '사모트라케', '이 이름은 어디서 왔나'],
    '/trace/pandora': ['같은 원천의 다른 흔적', '판도라의 상자'],
    '/trace/pandoras-box': ['피토스', '픽시스'],
    '/source/zeus': ['옥황상제', '여기서 나온 흔적', '목성', '한국 대응물'],
    '/source/ariadne': ['실마리', '인셉션', 'level-kid', 'level-adult'],
    '/source/achilles': ['트로이 목마', '역린'],
    '/source/seven-deadly-sins': ['일곱 죄악', '삼독', '세븐'],
    // 클라이언트 화면도 서버 HTML 에 뼈대가 들어 있어야 한다. 없으면 첫 화면이 잠깐 빈다.
    '/capture': ['조우 캡처', '붙여 넣', '담기'],
    '/settings': ['진도와 백업', '백업 내려받기', '눈높이'],
    // 담은 것이 없으면 요청서 구역은 접힌다. 서버 HTML 에는 안내와 입력 칸까지만 있으면 된다.
    '/request': ['카드 요청서', '담아 둔 것', '개발 도구에 붙여 넣', '담기'],
    '/quiz': ['오늘의 복습'],
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
      // 지난 실행이 남긴 진도가 있으면 개수가 어긋난다. 빈 상태에서 시작한다.
      await s.send('Page.navigate', { url: BASE + '/' });
      for (let i = 0; i < 50 && !s.events.includes('Page.loadEventFired'); i++) await sleep(100);
      await s.js('localStorage.clear(); sessionStorage.clear();');
      await s.send('Page.reload');
      await sleep(1500);

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

      // 목록은 한 번에 60장씩 그린다. 삼백 장을 통째로 그리면 폰에서 첫 그림이 느려진다.
      const PAGE = 60;
      expect('첫 화면 흔적 수', await s.js(CARDS), Math.min(PAGE, N_TRACE));
      await s.js(
        `[...document.querySelectorAll('main button')].find((b) => b.textContent.includes('더 보기'))?.click()`,
      );
      await sleep(300);
      expect('더 보기를 누르면 이어서 나온다', await s.js(CARDS), Math.min(PAGE * 2, N_TRACE));
      // 디자인 A · D — 문양과 미궁이 실제로 그려지는지 본다.
      expect(
        '목록의 모든 카드에 문양이 붙는다',
        await s.js(`document.querySelectorAll('main ul li a svg').length >= ${Math.min(60, N_TRACE)}`),
        true,
      );
      expect(
        '미궁 진도가 그려진다',
        await s.js(`!!document.querySelector('main a[href="/settings"] svg path[stroke-dasharray]')`),
        true,
      );
      expect(
        '오늘 할 일 줄이 숫자를 채운다',
        await s.js(`[...document.querySelectorAll('main a[href="/quiz"] span')].pop()?.textContent`),
        `${N_TRACE}개`,
      );

      await s.js('document.querySelector("input[type=search]").focus()');
      await s.send('Input.insertText', { text: '판도라' });
      await sleep(400);
      expect('검색 "판도라"', await s.js(CARDS), searchHits('판도라'));

      await s.js(clearSearch);
      await sleep(250);
      await s.js('document.querySelector("input[type=search]").focus()');
      await s.send('Input.insertText', { text: 'nasa' });
      await sleep(400);
      // 이름에는 없고 domain_hint 로만 걸리는 검색이다.
      expect('검색 "nasa" (domain_hint)', await s.js(CARDS), searchHits('nasa'));

      await s.js(clearSearch);
      await sleep(250);
      await s.js(`[...document.querySelectorAll('main button')].find(b => b.textContent.startsWith('브랜드')).click()`);
      await sleep(400);
      expect('갈래 "브랜드" 필터', await s.js(CARDS), Math.min(PAGE, N_BRAND));

      await s.js(`[...document.querySelectorAll('main button')].find(b => b.textContent.startsWith('원천')).click()`);
      await sleep(400);
      expect('원천 탭 (필터 초기화 포함)', await s.js(CARDS), Math.min(PAGE, N_SOURCE));
      expect(
        '탭 옆 숫자는 전체를 보여 준다',
        await s.js(
          // 정규식의 역슬래시는 전달 과정에서 사라지므로 글자를 직접 걸러 낸다.
          `[...[...document.querySelectorAll('main button')].find(b => b.textContent.startsWith('원천')).textContent].filter(c => c >= '0' && c <= '9').join('')`,
        ),
        String(N_SOURCE),
      );

      await s.js(`document.querySelector('main ul li a[href^="/source/"]').click()`);
      await sleep(1500);
      const moved = await s.js('location.pathname');
      String(moved).startsWith('/source/') ? ok('카드 클릭 이동', moved) : bad('카드 클릭 이동', moved);

      // ── 3부. 학습 루프 (M1) ──────────────────────────────────────
      console.log('\n[3] 학습 루프');
      const clickText = (selector, text) =>
        `(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.textContent.includes(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`;

      await s.js('localStorage.clear()');
      await s.send('Page.navigate', { url: BASE + '/quiz' });
      await sleep(1800);

      const firstPrompt = await s.js('document.querySelector("main h1")?.textContent ?? ""');
      firstPrompt.length > 0 ? ok('첫 문제가 나온다', firstPrompt.slice(0, 30) + '…') : bad('첫 문제', '비어 있음');

      // 정답을 먼저 보여주지 않아야 한다 (D6).
      const revealedEarly = await s.js(
        `document.querySelector('main')?.textContent.includes('이 이름이 붙은 까닭') ?? false`,
      );
      expect('답을 먼저 보여주지 않는다', revealedEarly, false);

      // 힌트는 세 번까지 열린다.
      for (let i = 0; i < 3; i++) {
        await s.js(clickText('button', '힌트 보기'));
        await sleep(200);
      }
      const hintCount = await s.js(
        `[...document.querySelectorAll('main p')].filter(p => p.textContent.trim().startsWith('힌트 ')).length`,
      );
      expect('힌트 3단', hintCount, 3);
      expect('힌트를 다 열면 버튼이 사라진다', await s.js(clickText('button', '힌트 보기')), false);

      // 답을 보고 자기평가하면 다음 문제로 넘어간다.
      const isSelf = await s.js('!!document.querySelector("main textarea")');
      if (isSelf) {
        await s.js(`document.querySelector('main textarea').focus()`);
        await s.send('Input.insertText', { text: '테스트 답안' });
        await s.js(clickText('button', '답 보기'));
        await sleep(300);
        expect('답을 열면 까닭이 보인다', await s.js(`document.querySelector('main').textContent.includes('이 이름이 붙은 까닭')`), true);
        expect('흔적에서 원천으로 실이 그려진다', await s.js(`!!document.querySelector('.thread-draw')`), true);
        expect('실이 도착하는 자리에 문양이 있다', await s.js(`!!document.querySelector('.thread-target svg')`), true);
        // 답 공개 화면도 눈으로 볼 수 있게 남긴다. 실이 다 그려질 때까지 기다린다.
        await sleep(1500);
        {
          const m = await s.send('Page.getLayoutMetrics');
          const size = m.cssContentSize ?? m.contentSize;
          const shot = await s.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true,
            clip: { x: 0, y: 0, width: 390, height: Math.min(size.height, 4000), scale: 1 },
          });
          writeFileSync(join(SHOTS, 'm-quiz-reveal.png'), Buffer.from(shot.data, 'base64'));
        }
        await s.js(clickText('button', '정확히 알고 있었다'));
      } else {
        // 객관식이거나 자유입력인 경우
        const hasChoices = await s.js(`document.querySelectorAll('main ul li button').length >= 3`);
        if (hasChoices) await s.js(`document.querySelector('main ul li button').click()`);
        else {
          await s.js(`document.querySelector('main input').focus()`);
          await s.send('Input.insertText', { text: '아무거나' });
          await s.js(clickText('button', '확인'));
        }
        await sleep(300);
        await s.js(clickText('button', '다음'));
      }
      await sleep(500);

      const secondPrompt = await s.js('document.querySelector("main h1")?.textContent ?? ""');
      secondPrompt && secondPrompt !== firstPrompt
        ? ok('푼 뒤 다음 문제로 넘어간다')
        : bad('다음 문제', `여전히 "${secondPrompt.slice(0, 20)}"`);

      const saved = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.reviews') || '[]')`);
      Array.isArray(saved) && saved.length === 1 && saved[0].reps >= 0
        ? ok('복습 상태가 저장된다', `due ${saved[0].due}`)
        : bad('복습 상태 저장', JSON.stringify(saved));
      const logs = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.logs') || '[]')`);
      expect('퀴즈 기록이 남는다', Array.isArray(logs) && logs.length, 1);

      // 다시 열면 방금 푼 것은 오늘 대기열에서 빠진다.
      await s.send('Page.navigate', { url: BASE + '/quiz' });
      await sleep(1500);
      const totalNow = await s.js(
        `(document.querySelector('main div div span:last-child')?.textContent ?? '').replace(/[^0-9]/g, '')`,
      );
      Number(totalNow) === N_TRACE - 1
        ? ok('푼 흔적은 오늘 대기열에서 빠진다', `남은 ${totalNow}개`)
        : bad('대기열 갱신', `남은 것이 ${totalNow}개로 나옵니다 (기대 ${N_TRACE - 1})`);

      // ── 4부. 눈높이 전환 (M1-5) ──────────────────────────────────
      console.log('\n[4] 눈높이');
      await s.send('Page.navigate', { url: BASE + '/source/nike-goddess' });
      await sleep(1200);
      expect('처음은 어른 눈높이', await s.js('document.documentElement.dataset.level'), 'adult');
      const adultVisible = await s.js(
        `!!document.querySelector('.level-adult')?.offsetParent && !document.querySelector('.level-kid')?.offsetParent`,
      );
      expect('어른 요약만 보인다', adultVisible, true);

      await s.js(clickText('header button', '아이'));
      await sleep(300);
      expect('아이로 전환된다', await s.js('document.documentElement.dataset.level'), 'kid');
      const kidVisible = await s.js(
        `!!document.querySelector('.level-kid')?.offsetParent && !document.querySelector('.level-adult')?.offsetParent`,
      );
      expect('아이 요약만 보인다', kidVisible, true);

      // 새로 고쳐도 유지되고, 화면이 번쩍이지 않도록 첫 그림부터 아이 눈높이여야 한다.
      await s.send('Page.navigate', { url: BASE + '/source/ariadne' });
      await sleep(1000);
      expect('새로 고쳐도 유지된다', await s.js('document.documentElement.dataset.level'), 'kid');

      // 아이 눈높이의 퀴즈는 객관식이어야 한다.
      await s.send('Page.navigate', { url: BASE + '/quiz' });
      await sleep(1500);
      const kidChoices = await s.js(`document.querySelectorAll('main ul li button').length`);
      expect('아이 퀴즈는 선택지 3개', kidChoices, 3);

      // ── 4.5부. 실 지도 (D27-C) ───────────────────────────────────
      console.log('\n[4.5] 실 지도');
      await s.send('Page.navigate', { url: BASE + '/graph' });
      await sleep(1500);
      expect(
        '점이 모두 그려진다',
        await s.js(`document.querySelectorAll('main svg > g > g circle').length >= ${N_TRACE + N_SOURCE}`),
        true,
      );
      expect(
        '실이 그려진다',
        await s.js(`document.querySelectorAll('main svg line').length > 0`),
        true,
      );
      // 점을 누르면 그 둘레만 남는다.
      await s.js(`document.querySelectorAll('main svg > g > g')[0].dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))`);
      await sleep(400);
      expect(
        '점을 누르면 카드로 가는 길이 열린다',
        await s.js(`!!document.querySelector('main a[href^="/trace/"], main a[href^="/source/"]')`),
        true,
      );

      // ── 5부. 진도와 백업 ─────────────────────────────────────────
      console.log('\n[5] 진도와 백업');
      await s.send('Page.navigate', { url: BASE + '/settings' });
      await sleep(1300);
      const settingsText = await s.js(`document.querySelector('main')?.textContent ?? ''`);
      settingsText.includes('한 번 이상 보았고') && settingsText.includes('백업 내려받기')
        ? ok('진도와 백업 화면이 뜬다')
        : bad('진도와 백업 화면', settingsText.slice(0, 60));

      // 눈높이를 여기서도 바꿀 수 있어야 한다.
      await s.js(clickText('main button', '어른'));
      await sleep(300);
      expect('설정에서 눈높이 전환', await s.js('document.documentElement.dataset.level'), 'adult');
      expect(
        '고른 값이 저장된다',
        await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.profile') || '{}').level`),
        'adult',
      );

      // ── 6부. 조우 캡처와 PWA (M2) ────────────────────────────────
      console.log('\n[6] 조우 캡처와 PWA');
      const manifest = await (await fetch(BASE + '/manifest.webmanifest')).json();
      manifest.share_target?.method === 'GET' && manifest.share_target?.action?.endsWith('/capture')
        ? ok('매니페스트에 공유 대상이 있다', manifest.share_target.action)
        : bad('공유 대상', JSON.stringify(manifest.share_target));
      manifest.icons?.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')
        ? ok('설치용 아이콘이 갖춰져 있다', `${manifest.icons.length}종`)
        : bad('아이콘', JSON.stringify(manifest.icons));
      expect('서비스 워커 파일이 있다', (await fetch(BASE + '/sw.js')).status, 200);
      expect('아이콘 파일이 있다', (await fetch(BASE + '/icons/icon-512.png')).status, 200);

      await s.js('localStorage.clear(); sessionStorage.clear();');
      // 공유 시트가 이 주소로 열어 준다.
      await s.send('Page.navigate', {
        url: BASE + '/capture?text=' + encodeURIComponent('오늘 나이키 운동화를 샀다. 로고가 좋다.'),
      });
      await sleep(1600);

      const capText = await s.js(`document.querySelector('main')?.textContent ?? ''`);
      capText.includes('1개를 알아봤습니다') && capText.includes('나이키')
        ? ok('공유로 들어온 글에서 흔적을 알아본다')
        : bad('공유 캡처', capText.slice(0, 80));

      const stored = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.captures') || '[]')`);
      Array.isArray(stored) && stored.length === 1 && stored[0].matched_trace_ids?.[0] === 'trace:nike'
        ? ok('캡처가 저장된다', stored[0].matched_trace_ids.join(', '))
        : bad('캡처 저장', JSON.stringify(stored));

      // 같은 주소를 새로 고쳐도 두 번 담기면 안 된다.
      await s.send('Page.reload');
      await sleep(1400);
      expect(
        '새로 고쳐도 두 번 담기지 않는다',
        (await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.captures') || '[]').length`)),
        1,
      );

      // 오늘 복습에 넣으면 그 흔적이 대기열 맨 앞으로 온다 (M2-4).
      await s.js(clickText('button', '오늘 복습에 넣기'));
      await sleep(400);
      const bumped = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.reviews') || '[]')`);
      Array.isArray(bumped) && bumped.some((r) => r.itemId === 'trace:nike')
        ? ok('캡처한 흔적이 오늘 복습에 들어간다', bumped[0]?.due)
        : bad('복습 편입', JSON.stringify(bumped));

      // 직접 붙여 넣는 길도 열려 있어야 한다 (아이폰에는 공유 대상이 없다).
      await s.js(`document.querySelector('main textarea').focus()`);
      await s.send('Input.insertText', { text: '기사에서 판도라의 상자라는 표현을 보았다' });
      await sleep(200);
      await s.js(clickText('main button', '담기'));
      await sleep(500);
      const after = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.captures') || '[]')`);
      after.length === 2 && after[1].matched_trace_ids.includes('trace:pandoras-box')
        ? ok('직접 붙여 넣어도 알아본다', after[1].matched_trace_ids.join(', '))
        : bad('직접 입력', JSON.stringify(after.map((c) => c.matched_trace_ids)));

      // 원천 이름만 적어도 흔적으로 이어져야 한다 (2026-09-08 오너 보고).
      await s.js(`document.querySelector('main textarea').focus()`);
      await s.send('Input.insertText', { text: '루브르에서 니케 조각을 보았다' });
      await sleep(200);
      await s.js(clickText('main button', '담기'));
      await sleep(500);
      const viaSource = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.captures') || '[]').at(-1)`);
      viaSource?.matched_trace_ids?.includes('trace:nike') && viaSource?.hits?.[0]?.via === 'source'
        ? ok('원천 이름만 적어도 흔적으로 이어진다', `${viaSource.hits[0].hit} → 나이키`)
        : bad('원천 경유 매칭', JSON.stringify(viaSource?.matched_trace_ids));
      expect(
        '원천을 통해 이어졌다고 화면에 밝힌다',
        await s.js(`document.querySelector('main').textContent.includes('원천 이름')`),
        true,
      );


      // ── 7부. 카드 요청서 (D28) ────────────────────────────────
      console.log(String.fromCharCode(10) + '[7] 카드 요청서');
      await s.js('localStorage.clear(); sessionStorage.clear();');

      // 카드 화면에서 담는다.
      await s.send('Page.navigate', { url: BASE + '/trace/pandoras-box' });
      await sleep(1300);
      await s.js(clickText('button', '이것에 대해 더 알고 싶습니다'));
      await sleep(300);
      await s.js(`document.querySelector('main textarea').focus()`);
      await s.send('Input.insertText', { text: '항아리였다는 이야기를 더 보고 싶습니다' });
      await sleep(200);
      await s.js(clickText('main button', '담기'));
      await sleep(400);

      const wished = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.wishes') || '[]')`);
      wished.length === 1 && wished[0].origin?.id === 'trace:pandoras-box'
        ? ok('카드 화면에서 요청서에 담긴다', wished[0].note)
        : bad('카드에서 담기', JSON.stringify(wished));

      expect(
        '담고 나면 담긴 것으로 보인다',
        await s.js(`document.querySelector('main').textContent.includes('요청서에 담아 두었습니다')`),
        true,
      );

      // 같은 카드를 다시 열어도 담긴 상태가 유지된다.
      await s.send('Page.reload');
      await sleep(1300);
      expect(
        '다시 열어도 담긴 상태가 남는다',
        await s.js(`document.querySelector('main').textContent.includes('요청서에 담아 두었습니다')`),
        true,
      );

      // 요청서 화면에서 글이 뽑힌다.
      await s.send('Page.navigate', { url: BASE + '/request' });
      await sleep(1300);
      const slip = await s.js(`document.querySelectorAll('main textarea')[1]?.value ?? ''`);
      const wanted = [
        'Ariadne 카드 요청서',
        '판도라의 상자',
        '항아리였다는 이야기',
        'trace:pandoras-box',
        'content/traces',
        'npm run check',
        'greco-roman-myth',
      ];
      const missing = wanted.filter((w) => !slip.includes(w));
      missing.length === 0
        ? ok('요청서에 필요한 것이 모두 실린다', `${slip.length}자`)
        : bad('요청서 내용', '없음: ' + missing.join(', '));

      // 자유 입력으로도 담긴다.
      await s.js(`document.querySelector('main textarea').focus()`);
      await s.send('Input.insertText', { text: '성경에서 온 법률 용어' });
      await sleep(200);
      await s.js(clickText('main button', '담기'));
      await sleep(400);
      expect(
        '자유 입력도 담긴다',
        (await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.wishes') || '[]').length`)),
        2,
      );

      // 캡처에서 못 알아본 것을 요청서로 넘긴다.
      await s.send('Page.navigate', {
        url: BASE + '/capture?text=' + encodeURIComponent('다모클레스의 칼이라는 말을 들었다'),
      });
      await sleep(1600);
      await s.js(clickText('main button', '카드 요청서에 담기'));
      await sleep(400);
      const fromCapture = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.wishes') || '[]').at(-1)`);
      const cap = await s.js(`JSON.parse(localStorage.getItem('ariadne.v1.captures') || '[]').at(-1)`);
      fromCapture?.origin?.kind === 'capture' && cap?.status === 'candidate'
        ? ok('캡처가 후보와 요청서로 한꺼번에 넘어간다', fromCapture.text.slice(0, 20))
        : bad('캡처에서 요청', JSON.stringify({ w: fromCapture?.origin, c: cap?.status }));

      // 백업에 요청 쪽지가 함께 실린다.
      await s.send('Page.navigate', { url: BASE + '/settings' });
      await sleep(1200);
      const snapWishes = await s.js(
        `JSON.parse(localStorage.getItem('ariadne.v1.wishes') || '[]').length`,
      );
      expect('요청 쪽지가 기기에 남아 있다', snapWishes, 3);

      await s.js('localStorage.clear(); sessionStorage.clear();');

      // 스크린샷 남기기
      for (const [name, path] of [
        ['m-home', '/'],
        ['m-trace-nike', '/trace/nike'],
        ['m-source-ariadne', '/source/ariadne'],
        ['m-quiz', '/quiz'],
        ['m-settings', '/settings'],
        ['m-capture', '/capture'],
        ['m-graph', '/graph'],
        ['m-request', '/request'],
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
      ok('스크린샷 8장', 'tests/e2e/shots/');
      s.ws.close();
    }
  }
} finally {
  killTree(chrome);
  killTree(server);
  killPort(PORT);
  killPort(CDP_PORT);
}

console.log(`\n실패 ${fails}건`);
process.exit(fails ? 1 : 0);
