/**
 * 지명 카드의 지도 계산 (D48).
 *
 * 앞서는 해안선을 손으로 그린 약도를 실었다. 두 번 고쳐 그렸지만 끝내 지도로 읽히지 않았다.
 * 직접 그린 선은 아무리 다듬어도 실제 지도만큼의 정보를 담지 못한다.
 *
 * 그래서 위키미디어 공용에 있는 실제 지도를 걸고, 카드에 적힌 위경도로 그 위에 자리를 찍는다.
 * 지도 그림은 리포에 두지 않는다. 그림을 다루는 방식은 D29 와 같다.
 *
 * 바탕 지도는 등장방형 도법이라 위경도가 픽셀에 그대로 비례한다.
 * 그래서 자리를 찾는 계산이 나눗셈 두 번으로 끝나고,
 * 담는 칸의 가로세로 비율을 바탕 지도의 비율에 맞추면
 * 가로와 세로를 같은 비율로 잘라 내는 것만으로 확대가 된다.
 *
 * 그리고 실제로 그 자리를 보고 싶을 때를 위해 구글 지도로 넘기는 링크를 함께 만든다.
 * 좌표만 넘기면 되므로 열쇠도 지도 서버도 필요 없고, 폰에서는 지도 앱이 그대로 열린다.
 */
import { imageUrl } from './image';

export interface MapBase {
  /** 위키미디어 공용의 파일 이름 */
  file: string;
  /** 이 그림이 덮는 범위 (도) */
  north: number;
  south: number;
  west: number;
  east: number;
  /** 원본의 가로세로 비율. 담는 칸도 이 비율을 쓴다. */
  ratio: number;
  author: string;
  license: string;
}

/**
 * 바탕 지도.
 *
 * 둘 다 등장방형 도법이며, 덮는 범위는 파일 설명에 적힌 값이다.
 * 지중해 지도는 남북을 128% 늘려 그렸는데, 그 늘림이 원본 비율에 이미 들어가 있으므로
 * 여기서는 따로 셈하지 않는다. 잘라 내기만 하고 다시 늘리지 않기 때문이다.
 */
export const MAP_BASES: Record<string, MapBase> = {
  med: {
    file: 'Mediterranean Sea location map.svg',
    north: 48,
    south: 29,
    west: -7,
    east: 42.5,
    ratio: 1754 / 862,
    author: 'NordNordWest',
    license: 'CC BY-SA 3.0 de',
  },
  world: {
    file: 'World location map (equirectangular 180).svg',
    north: 90,
    south: -90,
    west: -180,
    east: 180,
    ratio: 2,
    author: 'TUBS',
    license: 'CC BY-SA 3.0',
  },
};

export const DEFAULT_BASE = 'med';

/** 카드 frontmatter 의 `map:` 묶음 (docs/02-SCHEMA.md) */
export interface MapPin {
  lat: number;
  lng: number;
  /** 보여 줄 경도 폭(도). 적지 않으면 바탕 지도 전체를 보여 준다. */
  span?: number;
  /** 바탕 지도 이름. 적지 않으면 지중해 지도를 쓴다. */
  base?: string;
  /** 점이 아니라 넓은 자리일 때 그 반지름(도). 점 대신 옅은 원을 그린다. */
  spread?: number;
  /** 지도 위에 붙일 이름. 적지 않으면 카드 이름을 쓴다. */
  label?: string;
  /** 이 자리가 무엇인지 한두 문장 */
  note?: string;
  /** 구글 지도 링크를 감출 때만 false 를 적는다. */
  open?: boolean;
}

export interface MapView {
  base: MapBase;
  /** 불러올 그림의 주소 */
  src: string;
  /** 잘라 낸 비율. 1 이면 지도 전체 */
  crop: number;
  /** 담는 칸의 가로세로 비율 */
  ratio: number;
  /** 그림의 크기와 자리. 모두 담는 칸을 100 으로 본 값이다. */
  img: { size: number; left: number; top: number };
  /** 표시할 자리의 가운데. 담는 칸을 100 으로 본 값이다. */
  x: number;
  y: number;
  /** 넓은 자리면 그 반지름. 담는 칸의 가로를 100 으로 본 값이며, 점이면 0 이다. */
  radius: number;
  /** 이름표를 점의 왼쪽에 두어야 잘리지 않는 자리인가 */
  flip: boolean;
  /** 구글 지도 주소. 카드가 감추라고 하면 null */
  google: string | null;
  /** 사람이 읽는 좌표 */
  coord: string;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 좌표를 그대로 넘긴다. 열쇠도 지도 서버도 필요 없고, 폰에서는 지도 앱이 열린다. */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? '북위' : '남위';
  const ew = lng >= 0 ? '동경' : '서경';
  return `${ns} ${Math.abs(lat).toFixed(2)}°, ${ew} ${Math.abs(lng).toFixed(2)}°`;
}

/** 그 좌표가 그 바탕 지도 안에 드는가. 감사가 이것으로 엉뚱한 자리를 잡는다. */
export function insideBase(base: MapBase, lat: number, lng: number): boolean {
  return lat <= base.north && lat >= base.south && lng >= base.west && lng <= base.east;
}

export function mapView(pin: MapPin): MapView | null {
  const base = MAP_BASES[pin.base ?? DEFAULT_BASE];
  if (!base) return null;
  if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return null;

  const lngRange = base.east - base.west;
  const latRange = base.north - base.south;

  // 너무 좁게 자르면 바탕 그림의 화소가 드러난다. 2% 아래로는 내려가지 않는다.
  const crop = clamp((pin.span ?? lngRange) / lngRange, 0.02, 1);

  // 그림 전체를 1 로 본 자리
  const ix = clamp((pin.lng - base.west) / lngRange, 0, 1);
  const iy = clamp((base.north - pin.lat) / latRange, 0, 1);

  // 잘라 낼 창의 왼쪽 위. 점을 가운데 두되 그림 밖으로 나가지 않게 한다.
  const ox = clamp(ix - crop / 2, 0, 1 - crop);
  const oy = clamp(iy - crop / 2, 0, 1 - crop);

  // 크게 자를수록 큰 그림이 필요하다. 주소가 갈릴수록 내려받기가 늘어나므로 두 단계만 둔다.
  const src = imageUrl(base.file, crop > 0.6 ? 1000 : 1800);

  const x = ((ix - ox) / crop) * 100;
  const y = ((iy - oy) / crop) * 100;

  return {
    base,
    src,
    crop,
    ratio: base.ratio,
    img: { size: 100 / crop, left: -(ox / crop) * 100, top: -(oy / crop) * 100 },
    x,
    y,
    radius: pin.spread ? (pin.spread / (crop * lngRange)) * 100 : 0,
    flip: x > 58,
    google: pin.open === false ? null : googleMapsUrl(pin.lat, pin.lng),
    coord: formatCoord(pin.lat, pin.lng),
  };
}
