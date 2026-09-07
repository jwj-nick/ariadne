/**
 * scripts/validate.ts — 콘텐츠 감사기.
 *
 *   npm run validate            content/traces, content/sources 를 검사하고 콘솔에 표를 출력한다.
 *   npm run validate -- --candidates   content/candidates 까지 함께 검사한다.
 *   npm run audit               위와 같되 reports/audit-<날짜>.md 도 남긴다.
 *
 * error 가 하나라도 있으면 종료 코드 1 로 끝난다. scripts/build.ts 가 이것을 게이트로 쓴다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCards, isTrace, isSource, REPO_ROOT, type Card } from './lib/content.ts';
import { runChecks, codeTitle, type Finding } from './lib/checks.ts';

const args = process.argv.slice(2);
const withCandidates = args.includes('--candidates');
const wantReport = args.includes('--report');

const buckets: Array<Card['bucket']> = withCandidates
  ? ['traces', 'sources', 'candidates']
  : ['traces', 'sources'];

const cards = loadCards(buckets);
const findings = runChecks(cards);

const errors = findings.filter((f) => f.severity === 'error');
const warns = findings.filter((f) => f.severity === 'warn');

function groupByCode(list: Finding[]): Map<string, Finding[]> {
  const m = new Map<string, Finding[]>();
  for (const f of list) m.set(f.code, [...(m.get(f.code) ?? []), f]);
  return new Map([...m].sort((a, b) => a[0].localeCompare(b[0])));
}

console.log('');
console.log('  Ariadne 콘텐츠 감사');
console.log('  ─────────────────────────────────────────────');
console.log(`  검사 대상   trace ${cards.filter(isTrace).length}장 · source ${cards.filter(isSource).length}장 (버킷: ${buckets.join(', ')})`);
console.log(`  결과        error ${errors.length}건 · warn ${warns.length}건`);
console.log('');

if (findings.length === 0) {
  console.log('  위반 사항이 없습니다.');
  console.log('');
} else {
  for (const [code, list] of groupByCode(findings)) {
    const mark = list[0]!.severity === 'error' ? 'ERROR' : 'warn ';
    console.log(`  [${mark}] ${code} ${codeTitle(code)} — ${list.length}건`);
    for (const f of list) {
      console.log(`          ${f.path}`);
      console.log(`            ${f.message}`);
    }
    console.log('');
  }
}

if (wantReport) {
  const today = new Date().toISOString().slice(0, 10);
  const dir = join(REPO_ROOT, 'reports');
  mkdirSync(dir, { recursive: true });
  const lines: string[] = [
    `# 콘텐츠 감사 리포트 — ${today}`,
    '',
    `- 검사 대상: trace ${cards.filter(isTrace).length}장, source ${cards.filter(isSource).length}장`,
    `- 버킷: ${buckets.join(', ')}`,
    `- 결과: error ${errors.length}건, warn ${warns.length}건`,
    '',
  ];
  if (findings.length === 0) {
    lines.push('위반 사항이 없습니다.', '');
  } else {
    lines.push('| 심각도 | 코드 | 항목 | 파일 | 내용 |', '|---|---|---|---|---|');
    for (const f of findings) {
      const msg = f.message.replace(/\|/g, '\\|');
      lines.push(`| ${f.severity} | ${f.code} | ${codeTitle(f.code)} | \`${f.path}\` | ${msg} |`);
    }
    lines.push('');
  }
  const out = join(dir, `audit-${today}.md`);
  writeFileSync(out, lines.join('\n'), 'utf8');
  console.log(`  리포트를 남겼습니다: reports/audit-${today}.md`);
  console.log('');
}

if (errors.length > 0) {
  console.error(`  error ${errors.length}건 때문에 감사에 실패했습니다. 빌드를 진행할 수 없습니다.`);
  console.log('');
  process.exit(1);
}
