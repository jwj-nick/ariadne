/**
 * 문양 목록이 두 곳에 나뉘어 있어서 어긋나기 쉽다.
 * 그림은 app/components/Emblem.tsx 에, 검사용 목록은 scripts/lib/schema.ts 에 있다.
 * 이 테스트가 둘을 붙들어 둔다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMBLEMS, DOMAIN_EMBLEM, emblemFor } from '../app/components/Emblem.tsx';
import { EMBLEM_NAMES, SOURCE_DOMAINS } from '../scripts/lib/schema.ts';
import { loadCards, isSource } from '../scripts/lib/content.ts';

test('그림 목록과 검사용 목록이 같다', () => {
  assert.deepEqual([...EMBLEM_NAMES].sort(), Object.keys(EMBLEMS).sort());
});

test('도메인마다 기본 문양이 있고, 그 문양이 실제로 그려져 있다', () => {
  for (const domain of SOURCE_DOMAINS) {
    const name = DOMAIN_EMBLEM[domain];
    assert.ok(name, `${domain} 에 기본 문양이 없습니다`);
    assert.ok(name in EMBLEMS, `${domain} 의 기본 문양 ${name} 이 그려져 있지 않습니다`);
  }
});

test('모든 원천 카드에 그릴 수 있는 문양이 정해진다', () => {
  for (const c of loadCards(['sources']).filter(isSource)) {
    const name = emblemFor(
      (c.data as Record<string, unknown>).emblem as string | undefined,
      String(c.data.domain),
    );
    assert.ok(name in EMBLEMS, `${String(c.data.id)} 의 문양 ${name} 이 없습니다`);
  }
});

test('모든 원천 카드가 문양을 직접 지정하고 있다', () => {
  const missing = loadCards(['sources'])
    .filter(isSource)
    .filter((c) => !(c.data as Record<string, unknown>).emblem)
    .map((c) => String(c.data.id));
  assert.deepEqual(missing, [], '문양이 지정되지 않은 원천이 있습니다');
});

test('그림은 선이나 원을 하나 이상 가진다', () => {
  for (const [name, shape] of Object.entries(EMBLEMS)) {
    const n = (shape.d?.length ?? 0) + (shape.circles?.length ?? 0) + (shape.dashed?.length ?? 0);
    assert.ok(n > 0, `${name} 이 비어 있습니다`);
  }
});
