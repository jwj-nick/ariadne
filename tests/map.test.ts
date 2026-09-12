/**
 * 지도 자리 계산 (D48).
 *
 * 여기서 계산이 틀리면 지도 위의 엉뚱한 데에 점이 찍히는데,
 * 화면만 보아서는 그것이 틀렸는지 알아보기 어렵다. 그래서 숫자로 확인한다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAP_BASES,
  formatCoord,
  googleMapsUrl,
  insideBase,
  mapView,
  type MapPin,
} from '../app/lib/map.ts';

const near = (a: number, b: number, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} 와 ${b} 의 차이가 ${tol} 보다 큽니다.`);

test('지도를 통째로 보여 줄 때 자리가 그림 전체 기준으로 잡힌다', () => {
  const med = MAP_BASES.med!;
  // 지중해 지도의 한가운데
  const v = mapView({ lat: (med.north + med.south) / 2, lng: (med.west + med.east) / 2 })!;
  assert.equal(v.crop, 1);
  near(v.x, 50);
  near(v.y, 50);
  near(v.img.size, 100);
  near(v.img.left, 0);
  near(v.img.top, 0);
});

test('네 모서리가 0% 와 100% 로 간다', () => {
  const med = MAP_BASES.med!;
  const nw = mapView({ lat: med.north, lng: med.west })!;
  near(nw.x, 0);
  near(nw.y, 0);
  const se = mapView({ lat: med.south, lng: med.east })!;
  near(se.x, 100);
  near(se.y, 100);
});

test('좁혀 보면 그림이 그만큼 커지고 점은 가운데에 온다', () => {
  const v = mapView({ lat: 41.118, lng: 29.068, span: 17 })!;
  // 49.5도 가운데 17도만 본다
  near(v.crop, 17 / 49.5);
  near(v.img.size, 100 / (17 / 49.5));
  near(v.x, 50);
  near(v.y, 50);
});

test('가장자리에 붙은 자리는 창을 밀지 않고 점을 옮긴다', () => {
  // 지브롤터는 지중해 지도의 서쪽 끝에서 1.4도 거리라, 가운데로 끌어올 수 없다.
  const v = mapView({ lat: 35.95, lng: -5.6, span: 14 })!;
  near(v.img.left, 0);
  assert.ok(v.x > 0 && v.x < 20, `왼쪽 끝에 붙어야 하는데 ${v.x}% 입니다.`);
  assert.equal(v.flip, false, '왼쪽에 있는 점의 이름표는 오른쪽에 붙어야 합니다.');
});

test('그림 밖으로 창이 나가지 않는다', () => {
  for (const pin of [
    { lat: 47.9, lng: 42.4, span: 10 },
    { lat: 29.1, lng: -6.9, span: 10 },
  ] satisfies MapPin[]) {
    const v = mapView(pin)!;
    assert.ok(v.img.left <= 0.01, `왼쪽이 ${v.img.left}% 입니다.`);
    assert.ok(v.img.top <= 0.01, `위쪽이 ${v.img.top}% 입니다.`);
    // 오른쪽 아래 끝도 칸을 다 덮어야 한다
    assert.ok(v.img.left + v.img.size >= 99.99, '오른쪽에 빈 자리가 생깁니다.');
    assert.ok(v.img.top + v.img.size >= 99.99, '아래쪽에 빈 자리가 생깁니다.');
  }
});

test('세계 지도의 경위도 0도가 한가운데에 온다', () => {
  const v = mapView({ base: 'world', lat: 0, lng: 0 })!;
  near(v.x, 50);
  near(v.y, 50);
});

test('넓은 자리는 점 대신 원이 되고 그 크기가 보이는 폭에 비례한다', () => {
  const v = mapView({ base: 'world', lat: 34, lng: -32, span: 95, spread: 24 })!;
  near(v.radius, (24 / 95) * 100);
  const dot = mapView({ base: 'world', lat: 34, lng: -32, span: 95 })!;
  assert.equal(dot.radius, 0);
});

test('이름표는 오른쪽에 치우친 점에서만 왼쪽으로 넘어간다', () => {
  assert.equal(mapView({ lat: 38, lng: 0 })!.flip, false);
  assert.equal(mapView({ lat: 38, lng: 40 })!.flip, true);
});

test('바탕 지도가 없으면 지도를 달지 않는다', () => {
  assert.equal(mapView({ lat: 38, lng: 20, base: 'moon' }), null);
  assert.equal(mapView({ lat: Number.NaN, lng: 20 }), null);
});

test('구글 지도 링크는 좌표만 넘긴다', () => {
  assert.equal(
    googleMapsUrl(41.118, 29.068),
    'https://www.google.com/maps/search/?api=1&query=41.118,29.068',
  );
  // 넓은 자리처럼 한 점으로 집을 수 없는 카드는 링크를 감춘다.
  assert.equal(mapView({ lat: 41.3, lng: 21.5, open: false })!.google, null);
  assert.ok(mapView({ lat: 41.3, lng: 21.5 })!.google);
});

test('좌표는 동서남북을 붙여 읽는다', () => {
  assert.equal(formatCoord(41.118, 29.068), '북위 41.12°, 동경 29.07°');
  assert.equal(formatCoord(-33.9, -18.4), '남위 33.90°, 서경 18.40°');
});

test('바탕 지도가 덮는 범위를 가릴 수 있다', () => {
  const med = MAP_BASES.med!;
  assert.equal(insideBase(med, 41.1, 29.1), true);
  // 대서양 한복판은 지중해 지도 밖이다
  assert.equal(insideBase(med, 34, -32), false);
  assert.equal(insideBase(MAP_BASES.world!, 34, -32), true);
});

test('내려받는 그림의 주소는 두 가지뿐이다', () => {
  const wide = mapView({ lat: 38, lng: 18 })!.src;
  const close = mapView({ lat: 38, lng: 18, span: 16 })!.src;
  assert.match(wide, /width=1000$/);
  assert.match(close, /width=1800$/);
  // 같은 정도로 좁힌 카드끼리는 같은 그림을 쓴다.
  assert.equal(close, mapView({ lat: 36, lng: 25, span: 13 })!.src);
});
