/**
 * 별자리 도형 (D46).
 *
 * 천문 카드에는 이미 사진이 걸린다. 그런데 안드로메다 은하 사진을 봐도
 * "그게 하늘 어디에 있는 무엇인지" 는 알 수 없다. 사진은 망원경이 본 것이고,
 * 사람이 맨눈으로 보는 것은 점 몇 개를 이은 모양이기 때문이다.
 *
 * 그래서 사진과 나란히 **맨눈으로 보이는 모양**을 놓는다.
 * 좌표는 실제 별의 상대 위치를 근사한 것이다. 정확한 적경·적위가 아니라
 * "밤하늘에서 이 모양을 찾을 수 있는가" 가 기준이다.
 *
 * 그림은 서버에서 그대로 그려진다. 자바스크립트가 필요 없다.
 */

interface Star {
  x: number;
  y: number;
  /** 밝기. 1 이 가장 밝다. 점의 크기가 된다. */
  m: number;
  /** 이름 붙일 만한 별에만 적는다. */
  name?: string;
}

interface Shape {
  label: string;
  /** 한국어 이름 */
  ko: string;
  stars: Star[];
  /** 이을 별의 번호 쌍 */
  lines: Array<[number, number]>;
  /** 맨눈으로 어떻게 찾는가 */
  hint: string;
}

const SHAPES: Record<string, Shape> = {
  orion: {
    label: 'Orion',
    ko: '오리온자리',
    hint: '겨울 남쪽 하늘. 나란한 별 셋(삼태성)이 가운데를 가로지른다.',
    stars: [
      { x: 34, y: 30, m: 1, name: '베텔게우스' },
      { x: 66, y: 26, m: 2 },
      { x: 41, y: 55, m: 2 },
      { x: 50, y: 53, m: 2 },
      { x: 59, y: 51, m: 2 },
      { x: 32, y: 80, m: 3 },
      { x: 70, y: 78, m: 1, name: '리겔' },
    ],
    lines: [
      [0, 1],
      [1, 6],
      [6, 5],
      [5, 0],
      [2, 3],
      [3, 4],
    ],
  },
  cassiopeia: {
    label: 'Cassiopeia',
    ko: '카시오페이아자리',
    hint: '북쪽 하늘. 알파벳 W 또는 M 모양으로 누워 있다.',
    stars: [
      { x: 12, y: 44, m: 2 },
      { x: 30, y: 66, m: 2 },
      { x: 50, y: 42, m: 1 },
      { x: 70, y: 68, m: 2 },
      { x: 88, y: 40, m: 3 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  pleiades: {
    label: 'Pleiades',
    ko: '플레이아데스 성단',
    hint: '황소자리 어깨. 좁은 자리에 별이 오글오글 모여 작은 국자처럼 보인다.',
    stars: [
      { x: 52, y: 52, m: 1, name: '알키오네' },
      { x: 70, y: 60, m: 2 },
      { x: 75, y: 54, m: 3 },
      { x: 44, y: 41, m: 2 },
      { x: 37, y: 49, m: 2 },
      { x: 40, y: 33, m: 2 },
      { x: 48, y: 62, m: 3 },
      { x: 31, y: 40, m: 3 },
      { x: 46, y: 28, m: 3 },
    ],
    // 성단이라 선으로 잇지 않는다. 이어 놓으면 없는 모양을 만들어 내게 된다.
    lines: [],
  },
  andromeda: {
    label: 'Andromeda',
    ko: '안드로메다자리',
    hint: '가을 하늘. 페가수스 사각형 모서리에서 사슬처럼 길게 뻗는다.',
    stars: [
      { x: 16, y: 74, m: 2, name: '알페라츠' },
      { x: 34, y: 63, m: 3 },
      { x: 52, y: 50, m: 2, name: '미라크' },
      { x: 74, y: 36, m: 2 },
      { x: 46, y: 30, m: 3, name: 'M31' },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  perseus: {
    label: 'Perseus',
    ko: '페르세우스자리',
    hint: '카시오페이아 옆. 알골은 사흘에 한 번씩 눈에 띄게 어두워진다.',
    stars: [
      { x: 50, y: 44, m: 1 },
      { x: 34, y: 62, m: 2, name: '알골' },
      { x: 62, y: 36, m: 3 },
      { x: 72, y: 52, m: 3 },
      { x: 58, y: 68, m: 3 },
      { x: 42, y: 28, m: 3 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [2, 3],
      [0, 4],
      [0, 5],
    ],
  },
  'canis-major': {
    label: 'Canis Major',
    ko: '큰개자리',
    hint: '오리온 삼태성이 가리키는 쪽. 밤하늘에서 가장 밝은 별이 여기 있다.',
    stars: [
      { x: 44, y: 30, m: 1, name: '시리우스' },
      { x: 29, y: 38, m: 3 },
      { x: 56, y: 60, m: 2 },
      { x: 40, y: 70, m: 2 },
      { x: 64, y: 74, m: 3 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [2, 3],
      [2, 4],
    ],
  },
  gemini: {
    label: 'Gemini',
    ko: '쌍둥이자리',
    hint: '겨울 하늘. 밝은 별 둘이 나란히 있고 그 아래로 몸이 두 줄로 내려온다.',
    stars: [
      { x: 34, y: 16, m: 2, name: '카스토르' },
      { x: 58, y: 20, m: 1, name: '폴룩스' },
      { x: 34, y: 36, m: 3 },
      { x: 56, y: 40, m: 3 },
      { x: 29, y: 56, m: 3 },
      { x: 50, y: 58, m: 3 },
      { x: 24, y: 76, m: 3 },
      { x: 46, y: 78, m: 3 },
    ],
    lines: [
      [0, 2],
      [2, 4],
      [4, 6],
      [1, 3],
      [3, 5],
      [5, 7],
      [2, 3],
    ],
  },
};

export const hasConstellation = (key: string): boolean => key in SHAPES;

const radius = (m: number): number => (m === 1 ? 3.4 : m === 2 ? 2.3 : 1.5);

export default function Constellation({ name }: { name: string }) {
  const shape = SHAPES[name];
  if (!shape) return null;

  return (
    <figure className="mb-7">
      <div className="overflow-hidden rounded-lg" style={{ background: '#12151f' }}>
        <svg viewBox="0 0 100 100" width="100%" role="img" aria-label={`${shape.ko} 모양`}>
          {/* 별을 잇는 선. 실제 하늘에는 없는 선이므로 아주 옅게 둔다. */}
          {shape.lines.map(([a, b], i) => {
            const p = shape.stars[a];
            const q = shape.stars[b];
            if (!p || !q) return null;
            return (
              <line
                key={i}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke="#6d7ea6"
                strokeWidth={0.5}
                strokeLinecap="round"
              />
            );
          })}
          {shape.stars.map((s, i) => (
            <g key={i}>
              {/* 밝은 별에는 옅은 무리를 둘러 준다. 실제로도 그렇게 보인다. */}
              {s.m === 1 && <circle cx={s.x} cy={s.y} r={radius(s.m) + 2.6} fill="#ffffff" opacity={0.16} />}
              <circle cx={s.x} cy={s.y} r={radius(s.m)} fill={s.m === 1 ? '#fffaf0' : '#dfe6f5'} />
              {s.name && (
                <text
                  x={s.x + radius(s.m) + 2}
                  y={s.y + 1.6}
                  fill="#9fb0d4"
                  fontSize={4}
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {s.name}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <span style={{ color: 'var(--thread)' }}>맨눈으로는 이렇게</span> · {shape.ko} ({shape.label}).{' '}
        {shape.hint}
      </figcaption>
    </figure>
  );
}
