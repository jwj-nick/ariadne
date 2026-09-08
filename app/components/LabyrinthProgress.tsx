'use client';

/**
 * 진도를 미궁 지도로 (D27-D).
 *
 * 숫자만으로는 얼마나 왔는지 몸으로 느껴지지 않는다.
 * 바깥에서 시작해 가운데로 감기는 미궁 길을 깔아 두고, 익힌 만큼 실이 안으로 들어간다.
 * 다 익히면 실이 중심에 닿는다. 이 앱의 이름이 곧 이 그림이다.
 *
 * 실이 두 겹이다.
 *  - 옅은 실 = 한 번이라도 본 흔적
 *  - 진한 실 = 복습 간격이 3주를 넘어 자리 잡은 흔적
 * 본 것과 남은 것은 다르므로 둘을 함께 보여 준다.
 *
 * `pathLength="100"` 을 주면 길이를 백분율로 다룰 수 있어서,
 * 브라우저에서 길이를 재지 않고도 서버가 그린 그림 그대로 진도를 표시할 수 있다.
 */

/** 바깥에서 가운데로 감기는 네모 나선. */
const PATH =
  'M6 6 H94 V94 H6 V14 H86 V86 H14 V22 H78 V78 H22 V30 H70 V70 H30 V38 H62 V62 H38 V46 H54 V54 H46';

export default function LabyrinthProgress({
  seen,
  settled,
  total,
  size = 108,
}: {
  seen: number;
  settled: number;
  total: number;
  size?: number;
}) {
  const pct = (n: number) => (total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : 0);
  const seenPct = pct(seen);
  const settledPct = pct(settled);
  const done = total > 0 && settled >= total;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
      role="img"
      aria-label={`흔적 ${total}개 가운데 ${seen}개를 보았고 ${settled}개가 자리 잡았습니다`}
    >
      {/* 아직 가지 않은 길 */}
      <path d={PATH} pathLength={100} stroke="var(--line)" strokeWidth={4} />
      {/* 한 번이라도 본 것 */}
      <path
        d={PATH}
        pathLength={100}
        stroke="var(--thread)"
        strokeWidth={4}
        opacity={0.32}
        strokeDasharray={`${seenPct} 100`}
      />
      {/* 자리 잡은 것 */}
      <path
        d={PATH}
        pathLength={100}
        stroke="var(--thread)"
        strokeWidth={4}
        strokeDasharray={`${settledPct} 100`}
      />
      {done && <circle cx={50} cy={50} r={6} fill="var(--thread)" />}
    </svg>
  );
}
