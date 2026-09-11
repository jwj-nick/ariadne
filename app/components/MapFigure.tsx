/**
 * 지중해 일대 약도 (D47).
 *
 * 지명 카드에는 사진이 걸려도 "그게 어디인가" 가 전해지지 않는다.
 * 보스포루스가 왜 "소가 건넌 자리" 인지는 글로 세 문장 읽는 것보다
 * 흑해와 지중해 사이의 그 좁은 목을 한 번 보는 편이 빠르다.
 *
 * 정확한 해안선이 아니라 약도다. 기준은 "여기가 어디쯤인지 잡히는가" 하나다.
 * 남북을 실제보다 늘려 그렸다. 실제 비율대로 그리면 지중해가 너무 얇아져
 * 땅인지 바다인지 구별되지 않는다.
 *
 * 색은 고정값이다. 밝은 화면과 어두운 화면에서 같은 그림이어야 지도로 읽힌다.
 */

const SEA = '#9cc2d6';
const LAND = '#e7ddc7';
const COAST = '#c3b596';

interface Spot {
  x: number;
  y: number;
  label: string;
  /** 이 자리가 무엇인가 */
  note: string;
  /** 좁은 물길이면 그 목을 가로지르는 짧은 선을 함께 긋는다. */
  strait?: { x1: number; y1: number; x2: number; y2: number };
  /** 이름표를 점의 왼쪽에 두어야 잘리지 않는 자리 */
  flip?: boolean;
}

const SPOTS: Record<string, Spot> = {
  bosphorus: {
    x: 150,
    y: 32,
    label: '보스포루스',
    note: '흑해와 마르마라해를 잇는 좁은 물길. 여기를 건너면 유럽에서 아시아가 된다.',
    strait: { x1: 145, y1: 27, x2: 155, y2: 37 },
    flip: true,
  },
  gibraltar: {
    x: 17,
    y: 55,
    label: '지브롤터',
    note: '대서양과 지중해가 만나는 목. 고대에는 여기가 세상의 서쪽 끝이었다.',
    strait: { x1: 12, y1: 50, x2: 22, y2: 60 },
  },
  'aegean-sea': {
    x: 134,
    y: 42,
    label: '에게해',
    note: '그리스 본토와 아나톨리아 사이의 바다. 섬이 촘촘해 배로 건너다니기 좋았다.',
    flip: true,
  },
  athens: { x: 127, y: 50, label: '아테네', note: '에게해 서쪽 기슭의 도시.', flip: true },
  europe: { x: 62, y: 16, label: '유럽', note: '처음에는 에게해 서쪽 땅만을 가리키던 이름이다.' },
  asia: { x: 178, y: 30, label: '아시아', note: '처음에는 에게해 건너편 땅만을 가리키던 이름이다.', flip: true },
  atlantic: { x: 8, y: 72, label: '대서양', note: '지브롤터 바깥의 큰 바다.' },
};

export const hasMap = (key: string): boolean => key in SPOTS;

/**
 * 북쪽 땅의 해안선. 반도는 여기에 넣지 않는다.
 * 한 path 안에서 위아래로 오가면 어디가 육지인지 눈으로 읽히지 않아,
 * 반도는 따로 얹는다.
 */
const NORTH =
  'M0,0 H200 V30 C194,36 182,41 170,43 L160,38 L152,31 ' +
  'C145,38 138,44 132,46 L122,44 C110,47 96,49 80,51 C55,53 28,55 0,54 Z';

/** 이탈리아 반도. 장화 모양이 알아볼 수 있을 만큼만. */
const ITALY = 'M94,48 L108,46 L106,64 L101,74 L97,71 L99,60 Z';

/** 그리스와 펠로폰네소스 */
const GREECE = 'M120,45 L134,45 L132,56 L128,53 L126,60 L123,54 Z';

/** 남쪽 땅 (북아프리카) */
const SOUTH = 'M0,78 C30,73 70,71 110,71 C150,71 176,75 200,79 V100 H0 Z';

export default function MapFigure({ spot }: { spot: string }) {
  const s = SPOTS[spot];
  if (!s) return null;

  return (
    <figure className="mb-7">
      <div className="overflow-hidden rounded-lg" style={{ background: SEA }}>
        <svg viewBox="0 0 200 100" width="100%" role="img" aria-label={`${s.label} 위치`}>
          <path d={NORTH} fill={LAND} stroke={COAST} strokeWidth={0.6} />
          <path d={ITALY} fill={LAND} stroke={COAST} strokeWidth={0.6} />
          <path d={GREECE} fill={LAND} stroke={COAST} strokeWidth={0.6} />
          {/* 흑해. 북쪽 땅 안쪽을 파낸 자리다. */}
          <ellipse cx={172} cy={14} rx={23} ry={8.5} fill={SEA} stroke={COAST} strokeWidth={0.6} />
          <text x={172} y={16.5} fill="#3e5a68" fontSize={5.5} textAnchor="middle">
            흑해
          </text>
          <path d={SOUTH} fill={LAND} stroke={COAST} strokeWidth={0.6} />
          <text x={100} y={88} fill="#8a7c5e" fontSize={5.5} textAnchor="middle">
            북아프리카
          </text>

          {/* 좁은 물길이면 그 목을 집어 준다. */}
          {s.strait && (
            <line
              x1={s.strait.x1}
              y1={s.strait.y1}
              x2={s.strait.x2}
              y2={s.strait.y2}
              stroke="#b23a2e"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          )}

          {/* 이 카드가 가리키는 자리 */}
          <circle cx={s.x} cy={s.y} r={7.5} fill="#b23a2e" opacity={0.2} />
          <circle cx={s.x} cy={s.y} r={2.8} fill="#b23a2e" />
          <text
            x={s.flip ? s.x - 5 : s.x + 5}
            y={s.y + 1.8}
            fill="#8d2b21"
            fontSize={6.5}
            fontWeight={700}
            textAnchor={s.flip ? 'end' : 'start'}
            style={{ letterSpacing: '-0.02em' }}
          >
            {s.label}
          </text>
        </svg>
      </div>
      <figcaption className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <span style={{ color: 'var(--thread)' }}>어디쯤인가</span> · {s.note} 남북을 늘려 그린 약도이며,
        해안선은 실제가 아닙니다.
      </figcaption>
    </figure>
  );
}
