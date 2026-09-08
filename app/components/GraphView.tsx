'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Emblem from './Emblem';

/**
 * 원천 그래프 (D27-C).
 *
 * 흔적과 원천을 점으로, 이어짐을 선으로 그린 별자리 화면이다.
 * 좌표는 빌드가 미리 계산해 두었으므로(`scripts/lib/layout.ts`) 여기서는 그리기만 한다.
 * 그래서 흔적이 300개가 되어도 폰에서 가볍고, 열 때마다 같은 자리에 같은 것이 있다.
 *
 * 조작
 *  - 끌면 움직이고, 두 손가락으로 벌리거나 휠을 굴리면 커진다.
 *  - 점을 누르면 그 둘레만 남기고 흐려지며, 아래에 카드로 가는 길이 열린다.
 */

export interface GraphNode {
  id: string;
  type: 'trace' | 'source';
  x: number;
  y: number;
  degree: number;
  name_ko: string;
  kicker: string;
  href: string;
  /** 원천에만 있다. */
  emblem?: string;
  /** 원천이면 도메인, 흔적이면 그 흔적이 가리키는 첫 원천의 도메인. */
  domain: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: string;
}

const DOMAIN_COLOR: Record<string, string> = {
  'greco-roman-myth': 'var(--dom-myth)',
  'bible-ot': 'var(--dom-ot)',
  'bible-nt': 'var(--dom-nt)',
  history: 'var(--dom-history)',
  literature: 'var(--dom-lit)',
};

const colorOf = (domain: string) => DOMAIN_COLOR[domain] ?? 'var(--muted)';

export default function GraphView({
  nodes,
  edges,
  bounds,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const PAD = 90;
  const width = bounds.maxX - bounds.minX + PAD * 2;
  const height = bounds.maxY - bounds.minY + PAD * 2;

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  /** 고른 점과 바로 이어진 것들. 나머지는 흐려진다. */
  const near = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const e of edges) {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    }
    return set;
  }, [selected, edges]);

  const reset = useCallback(() => {
    setView({ x: 0, y: 0, scale: 1 });
    setSelected(null);
  }, []);

  // 휠로 확대. 폰에서는 두 손가락을 쓴다.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => ({ ...v, scale: Math.min(6, Math.max(0.6, v.scale * (e.deltaY < 0 ? 1.12 : 0.89))) }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale: view.scale };
      drag.current = null;
    } else {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const next = Math.min(6, Math.max(0.6, (pinch.current.scale * dist) / pinch.current.dist));
      setView((v) => ({ ...v, scale: next }));
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    d.x = e.clientX;
    d.y = e.clientY;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId) {
      if (!drag.current.moved) setSelected(null);
      drag.current = null;
    }
  };

  const chosen = selected ? byId.get(selected) : undefined;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        {Object.entries(DOMAIN_COLOR).map(([domain, color]) => (
          <span key={domain} className="inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {DOMAIN_KO[domain]}
          </span>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-full px-2.5 py-1"
          style={{ color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
        >
          전체 보기
        </button>
      </div>

      <div
        ref={wrapRef}
        className="relative touch-none overflow-hidden rounded-lg select-none"
        style={{
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1px var(--line)',
          // 상자를 그래프 비율에 맞춘다. 고정 높이를 주면 위아래에 빈 자리가 크게 남는다.
          aspectRatio: `${width} / ${height}`,
          maxHeight: '72vh',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          viewBox={`${bounds.minX - PAD} ${bounds.minY - PAD} ${width} ${height}`}
          width="100%"
          height="100%"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: 'center',
            transition: drag.current ? 'none' : 'transform 120ms ease-out',
          }}
        >
          {/* 실 */}
          <g>
            {edges.map((e, i) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const dim = near ? !(near.has(e.from) && near.has(e.to)) : false;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.kind === 'traces_to' ? 'var(--thread)' : 'var(--line)'}
                  strokeWidth={e.kind === 'traces_to' ? 1.4 : 1}
                  opacity={dim ? 0.07 : e.kind === 'traces_to' ? 0.45 : 0.6}
                />
              );
            })}
          </g>

          {/* 점 */}
          <g>
            {nodes.map((n) => {
              const dim = near ? !near.has(n.id) : false;
              const isSource = n.type === 'source';
              const r = isSource ? 15 + Math.min(8, n.degree) : 5;
              return (
                <g
                  key={n.id}
                  opacity={dim ? 0.12 : 1}
                  style={{ cursor: 'pointer' }}
                  onPointerUp={(e) => {
                    if (drag.current?.moved) return;
                    e.stopPropagation();
                    setSelected((cur) => (cur === n.id ? null : n.id));
                  }}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={isSource ? 'var(--surface)' : colorOf(n.domain)}
                    stroke={colorOf(n.domain)}
                    strokeWidth={isSource ? 2 : 0}
                  />
                  {isSource && n.emblem && (
                    <g transform={`translate(${n.x - r * 0.62} ${n.y - r * 0.62}) scale(${(r * 1.24) / 100})`} style={{ color: colorOf(n.domain) }}>
                      <Emblem name={n.emblem} size={100} strokeWidth={7} />
                    </g>
                  )}
                  {(isSource || near?.has(n.id)) && (
                    <text
                      x={n.x}
                      y={n.y + r + 13}
                      textAnchor="middle"
                      fontSize={isSource ? 12 : 10}
                      fill="var(--ink)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {n.name_ko}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 고른 점의 안내 */}
      <div className="mt-3 min-h-[74px]">
        {chosen ? (
          <div className="rounded-lg p-3.5" style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            <p className="text-[12px]" style={{ color: colorOf(chosen.domain) }}>
              {chosen.type === 'source' ? '원천' : '흔적'} · {chosen.kicker}
            </p>
            <p className="mt-0.5 text-[17px] font-semibold">{chosen.name_ko}</p>
            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>
              이어진 것 {chosen.degree}개
            </p>
            <Link href={chosen.href} className="thread-link mt-2 inline-block text-[14px]">
              카드 열어 보기
            </Link>
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            점을 누르면 그 둘레만 남고, 끌면 움직이며, 두 손가락으로 벌리면 커집니다.
            굵은 점이 원천이고 작은 점이 흔적입니다.
          </p>
        )}
      </div>
    </div>
  );
}

const DOMAIN_KO: Record<string, string> = {
  'greco-roman-myth': '그리스·로마 신화',
  'bible-ot': '구약',
  'bible-nt': '신약',
  history: '역사',
  literature: '문학',
};
