/**
 * 별자리 도형(D46)과 그 옛 성도(D49)는 코드에 있고, 카드는 이름으로 그것을 가리킨다.
 * 이름이 어긋나면 화면에서 그림이 통째로 빠지는데 아무 경고도 나지 않는다.
 * 그래서 두 쪽을 여기서 붙들어 둔다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES } from '../app/components/Constellation.tsx';
import { loadCards } from '../scripts/lib/content.ts';

test('카드가 가리키는 별자리가 모두 그려져 있다', () => {
  let used = 0;
  for (const c of loadCards(['traces', 'sources'])) {
    const name = (c.data as Record<string, unknown>).constellation;
    if (name === undefined) continue;
    used += 1;
    assert.equal(typeof name, 'string', `${c.path} 의 constellation 이 글이 아닙니다.`);
    assert.ok(name as string in SHAPES, `${c.path} 가 가리키는 별자리 "${String(name)}" 이 그려져 있지 않습니다.`);
  }
  assert.ok(used >= 11, `별자리를 단 카드가 ${used}장뿐입니다.`);
});

test('별자리마다 별과 옛 성도가 갖춰져 있다', () => {
  for (const [name, shape] of Object.entries(SHAPES)) {
    assert.ok(shape.stars.length >= 4, `${name} 의 별이 ${shape.stars.length}개뿐입니다.`);
    assert.ok(shape.hint.trim() !== '', `${name} 에 찾는 법이 없습니다.`);
    assert.ok(shape.atlas.file.trim() !== '', `${name} 에 옛 성도가 없습니다.`);
    assert.ok(shape.atlas.caption.trim() !== '', `${name} 의 옛 성도에 설명이 없습니다.`);
    assert.match(shape.atlas.file, /\.(jpe?g|png|tiff?)$/i, `${name} 의 옛 성도에 그림 확장자가 없습니다.`);
    assert.ok(!shape.atlas.file.startsWith('File:'), `${name} 의 옛 성도 이름에 "File:" 이 붙어 있습니다.`);
  }
});

test('별을 잇는 선이 있는 별자리는 실제 별을 가리킨다', () => {
  for (const [name, shape] of Object.entries(SHAPES)) {
    for (const [a, b] of shape.lines) {
      assert.ok(shape.stars[a], `${name} 의 선이 없는 별 ${a} 를 가리킵니다.`);
      assert.ok(shape.stars[b], `${name} 의 선이 없는 별 ${b} 를 가리킵니다.`);
      assert.notEqual(a, b, `${name} 에 자기 자신을 잇는 선이 있습니다.`);
    }
  }
});

test('옛 성도를 두 별자리가 같은 것으로 쓰지 않는다', () => {
  const files = Object.values(SHAPES).map((s) => s.atlas.file);
  // 플레이아데스는 황소자리 안에 있어 황소자리 판을 쓴다. 그 밖에는 겹치면 안 된다.
  assert.equal(new Set(files).size, files.length, '같은 옛 성도를 쓰는 별자리가 있습니다.');
});
