/**
 * 앱 아이콘을 만든다.
 *
 *   node scripts/make-icons.mjs
 *
 * 홈 화면에 설치하려면 192px 이상의 PNG 가 필요한데, 이 리포에는 이미지 편집 도구가 없다.
 * 그래서 SVG 를 헤드리스 Chrome 으로 그려서 PNG 로 받아 낸다.
 * 한 번 만들어 public/icons/ 에 넣어 두면 되므로 빌드마다 돌릴 필요는 없다.
 *
 * 그림은 미궁과 그 안을 지나는 붉은 실이다. 프로젝트 이름이 곧 이 그림이다.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'public', 'icons');
const PORT = 9336;
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

/** @param {{bg: string, pad: number}} opts */
const svg = ({ bg, pad }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${bg}"/>
  <g transform="translate(256 256)" fill="none" stroke="#cdc4b4" stroke-width="${18 - pad / 12}" stroke-linecap="square">
    <!-- 미궁의 담. 네모난 나선을 바깥에서 안으로 감는다. -->
    <path d="M -${180 - pad} -${180 - pad} H ${180 - pad} V ${180 - pad} H -${140 - pad}"/>
    <path d="M -${140 - pad} -${140 - pad} H ${140 - pad} V ${140 - pad} H -${100 - pad}"/>
    <path d="M -${100 - pad} -${100 - pad} H ${100 - pad} V ${100 - pad} H -${60 - pad}"/>
    <path d="M -${60 - pad} -${60 - pad} H ${60 - pad} V ${60 - pad} H -${20 - pad}"/>
  </g>
  <!-- 아리아드네의 실. 담을 굽이쳐 가로지르며 밖으로 나간다. -->
  <g transform="translate(256 256)" fill="none" stroke="#b23a2e" stroke-width="${24 - pad / 10}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 0 ${18 - pad * 0.1}
             C -${70 - pad * 0.3} -${10 + pad * 0.1}, ${70 - pad * 0.3} -${60 + pad * 0.2}, -${30 - pad * 0.1} -${112 + pad * 0.3}
             S ${60 - pad * 0.3} -${186 + pad * 0.5}, ${6} -${222 - pad}"/>
  </g>
  <circle cx="256" cy="${256 + 18 - pad * 0.1}" r="${24 - pad / 8}" fill="#b23a2e"/>
</svg>`;

const page = (bg, pad) => `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>
${svg({ bg, pad })}`;

const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('Chrome 을 찾지 못했습니다.');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + join(OUT, '_tmp-profile'),
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
  }
}

try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break;
    } catch {}
    await sleep(250);
  }
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = await new Promise((res, rej) => {
    const w = new WebSocket(tab.webSocketDebuggerUrl);
    w.addEventListener('open', () => res(w));
    w.addEventListener('error', rej);
  });
  const s = new Session(ws);
  await s.send('Page.enable');

  // 일반 아이콘과, 안드로이드가 둥글게 잘라 쓰는 maskable 아이콘을 따로 만든다.
  const jobs = [
    { name: 'icon-192.png', size: 192, bg: '#faf7f2', pad: 0 },
    { name: 'icon-512.png', size: 512, bg: '#faf7f2', pad: 0 },
    // maskable 은 바깥 20% 가 잘려 나갈 수 있으므로 그림을 안쪽으로 당긴다.
    { name: 'icon-512-maskable.png', size: 512, bg: '#faf7f2', pad: 44 },
  ];

  for (const job of jobs) {
    await s.send('Emulation.setDeviceMetricsOverride', {
      width: job.size,
      height: job.size,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await s.send('Page.navigate', {
      url: 'data:text/html;charset=utf-8,' + encodeURIComponent(page(job.bg, job.pad)),
    });
    await sleep(600);
    const shot = await s.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: job.size, height: job.size, scale: 1 },
    });
    writeFileSync(join(OUT, job.name), Buffer.from(shot.data, 'base64'));
    console.log(`  public/icons/${job.name}  ${job.size}x${job.size}`);
  }

  // 브라우저 탭 아이콘으로 쓸 SVG 도 함께 남긴다.
  writeFileSync(join(OUT, 'icon.svg'), svg({ bg: '#faf7f2', pad: 0 }).trim() + '\n', 'utf8');
  console.log('  public/icons/icon.svg');
  ws.close();
} finally {
  chrome.kill();
}
