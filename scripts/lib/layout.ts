/**
 * 그래프 화면에 쓸 좌표를 **빌드 시점에** 계산한다 (D27-C).
 *
 * 브라우저에서 힘 계산을 돌리면 노드가 늘어날수록 폰이 버거워지고,
 * 열 때마다 그림이 달라져서 "그 자리에 있던 것"이라는 기억이 생기지 않는다.
 * 좌표를 굳혀 두면 화면은 그리기만 하면 되고, 흔적 300개가 되어도 가볍다.
 *
 * 방식은 흔한 힘 기반 배치다.
 *   - 모든 노드 쌍이 서로 밀어낸다 (겹치지 않게)
 *   - 이어진 노드는 서로 당긴다 (관계가 가까이 모이게)
 *   - 전체를 가운데로 약하게 당긴다 (흩어져 날아가지 않게)
 *
 * 난수를 쓰되 씨앗을 고정해서, 같은 콘텐츠면 언제나 같은 그림이 나오게 한다.
 */

export interface LayoutNode {
  id: string;
  type: 'trace' | 'source';
  x: number;
  y: number;
  /** 이어진 개수. 화면에서 크기로 쓴다. */
  degree: number;
}

export interface Layout {
  nodes: LayoutNode[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/** 씨앗이 같으면 같은 수열이 나오는 아주 작은 난수기. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function computeLayout(
  nodes: Array<{ id: string; type: 'trace' | 'source' }>,
  edges: Array<{ from: string; to: string }>,
  opts: { iterations?: number; seed?: number } = {},
): Layout {
  const iterations = opts.iterations ?? 420;
  const rand = seeded(opts.seed ?? 20260908);
  const n = nodes.length;

  if (n === 0) return { nodes: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };

  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const degree = new Int32Array(n);

  /**
   * 노드가 늘어나면 그만큼 넓게 펼쳐야 밀도가 유지된다.
   * 원판의 넓이가 개수에 비례해야 하므로 반지름은 개수의 제곱근에 비례한다.
   * 흔적 200장 무렵을 기준으로 잡고, 거기서 몇 배가 되었는지로 축척을 정한다.
   */
  const spread = Math.sqrt(n / 200);

  // 처음 자리는 원 위에 고르게 뿌리고 조금씩 흔든다. 한 점에 겹치면 힘이 폭발한다.
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const radius = (260 + rand() * 120) * spread;
    x[i] = Math.cos(angle) * radius + (rand() - 0.5) * 40;
    y[i] = Math.sin(angle) * radius + (rand() - 0.5) * 40;
  }

  const links: Array<[number, number]> = [];
  for (const e of edges) {
    const a = index.get(e.from);
    const b = index.get(e.to);
    if (a === undefined || b === undefined || a === b) continue;
    links.push([a, b]);
    degree[a]! += 1;
    degree[b]! += 1;
  }

  // 밀어내는 힘은 거리의 제곱에 반비례하므로, 거리를 축척만큼 늘리려면 힘을 제곱만큼 키운다.
  const REPEL = 5200 * spread * spread;
  const SPRING = 0.012;
  // 이어진 것 사이의 거리도 함께 벌린다. 다만 축척을 그대로 따르면 실이 너무 길어져 절반만 반영한다.
  const REST = 96 * (1 + (spread - 1) * 0.5);
  // 가운데로 당기는 힘이 그대로면 넓힌 만큼 다시 뭉친다.
  const CENTER = 0.0022 / spread;

  const fx = new Float64Array(n);
  const fy = new Float64Array(n);

  for (let step = 0; step < iterations; step++) {
    fx.fill(0);
    fy.fill(0);

    // 서로 밀어내기
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = x[i]! - x[j]!;
        let dy = y[i]! - y[j]!;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          dx = (rand() - 0.5) * 2;
          dy = (rand() - 0.5) * 2;
          d2 = dx * dx + dy * dy + 0.01;
        }
        const force = REPEL / d2;
        const d = Math.sqrt(d2);
        const ux = (dx / d) * force;
        const uy = (dy / d) * force;
        fx[i]! += ux;
        fy[i]! += uy;
        fx[j]! -= ux;
        fy[j]! -= uy;
      }
    }

    // 이어진 것끼리 당기기
    for (const [a, b] of links) {
      const dx = x[b]! - x[a]!;
      const dy = y[b]! - y[a]!;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (d - REST) * SPRING;
      const ux = (dx / d) * force;
      const uy = (dy / d) * force;
      fx[a]! += ux;
      fy[a]! += uy;
      fx[b]! -= ux;
      fy[b]! -= uy;
    }

    // 가운데로 약하게
    for (let i = 0; i < n; i++) {
      fx[i]! -= x[i]! * CENTER;
      fy[i]! -= y[i]! * CENTER;
    }

    // 뒤로 갈수록 조금씩만 움직여 자리를 잡는다.
    const cool = 1 - step / iterations;
    const limit = 12 * cool + 0.4;
    for (let i = 0; i < n; i++) {
      const dx = Math.max(-limit, Math.min(limit, fx[i]!));
      const dy = Math.max(-limit, Math.min(limit, fy[i]!));
      x[i]! += dx;
      y[i]! += dy;
    }
  }

  const out: LayoutNode[] = nodes.map((node, i) => ({
    id: node.id,
    type: node.type,
    x: Math.round(x[i]! * 10) / 10,
    y: Math.round(y[i]! * 10) / 10,
    degree: degree[i]!,
  }));

  const bounds = {
    minX: Math.min(...out.map((p) => p.x)),
    minY: Math.min(...out.map((p) => p.y)),
    maxX: Math.max(...out.map((p) => p.x)),
    maxY: Math.max(...out.map((p) => p.y)),
  };

  return { nodes: out, bounds };
}
