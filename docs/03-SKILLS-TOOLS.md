# 03. SKILLS & TOOLS — 이 리포에서 쓰는 것들

## A. 프로젝트 스킬 (`.claude/skills/<name>/SKILL.md`)
초안은 이 리포에 포함. Claude Code 첫 세션에서 각 SKILL.md를 읽고 필요하면 다듬은 뒤 사용.

| 스킬 | 역할 | 입력 → 출력 |
|---|---|---|
| `trace-harvester` | 흔적 후보 대량 추출 | 명명표·용어집·리스트(텍스트/CSV/URL) → `content/candidates/*.md` (trace+source 쌍, frequency 추정) |
| `card-author` | 후보를 스키마 준수 카드로 완성 | candidate → trace/source 본문 5섹션, kid/adult, 한·영, why 필수 |
| `quiz-generator` | 카드에서 퀴즈 아이템 생성 | published 카드 → 6개 quiz_type별 아이템 + 3단 힌트 (정답 미노출 검사) |
| `link-auditor` | 링크·고아·스키마 감사 | content/ 전체 → 위반 리포트, 자동 수정 가능한 것은 PR 형태로 제안 |

향후 후보: `capture-matcher`(앱 런타임 프롬프트와 동일 로직을 오프라인 검증), `korea-parallel-finder`(한국 문화 대응물 제안).

## B. 슬래시 커맨드 (`.claude/commands/`)
- `/harvest <source-list>` — trace-harvester 실행, 후보 요약 표 출력
- `/author <candidate-glob>` — card-author로 카드 완성
- `/audit` — link-auditor 실행 + 빌드 dry-run → **구현됨: `npm run audit`**
- `/build` — `scripts/build` 실행, graph.json 갱신, 통계(노드/엣지/고아 수) → **구현됨: `npm run build:content`**
- `/log <요지>` — `docs/01-DESIGN-LOG.md`에 새 라운드 추가

> 2026-09-07 현재 `.claude/commands/` 파일은 아직 없다. 위 두 가지는 npm 스크립트로 먼저 구현했고,
> `/harvest` 와 `/author` 는 실제 콘텐츠 배치를 돌려 본 뒤에 만드는 편이 낫다고 보아 미뤄 두었다.
> 커밋 전 게이트는 `npm run check` 하나로 묶여 있다 (typecheck → test → validate → build).

## C. 훅 제안 (`.claude/settings.json` hooks)
- **PostToolUse(Write/Edit on `content/**`)** → `npm run validate` 자동 실행. frontmatter 위반 즉시 피드백.
- **Stop** → 콘텐츠 변경이 있었으면 `/audit` 결과 요약을 세션 끝에 출력.
- 원칙: 훅은 "감사"만 하고 콘텐츠를 자동 수정하지 않는다 (오너=큐레이터).

## D. MCP / 외부 툴
| 툴 | 용도 | 비고 |
|---|---|---|
| **Supabase MCP** | 스키마 마이그레이션, 사용자 상태 테이블 조회 | 콘텐츠는 여기 두지 않음 |
| **Vercel** (CLI 또는 MCP) | 배포·프리뷰 URL | 프리뷰를 오너 폰으로 바로 확인 |
| **Playwright MCP** | 모바일 뷰포트에서 캡처 흐름·퀴즈 흐름 E2E | share target은 실제 폰에서 별도 확인 |
| **Context7** 또는 공식 문서 fetch | Next.js App Router, Web Share Target, Supabase Auth 최신 API | 훈련 데이터 의존 금지 |
| **GitHub MCP** | 이슈 = 후보/버그, PR = 콘텐츠 배치 | 오너 승인 UI가 생기기 전 임시 승인 경로 |
| **Chrome (Claude in Chrome)** | 오너가 폰/PC 브라우저에서 앱 확인·피드백 | 오너 측 도구 |

## E. 데이터 소스 (harvester 입력 후보 — 모두 공개·검증 가능한 것만)
- 천문: IAU 행성·위성·소행성 명명 규칙 및 목록
- 원소: 주기율표 어원 (promethium, titanium, mercury, thorium 등)
- 우주·군사·IT 프로젝트 코드명 리스트 (Apollo, Artemis, Atlas, Titan, Trojan, Prometheus, Hermes, Argus…)
- 심리·의학 어원 사전 (narcissism, Oedipus, echo, morphine, hygiene, panic, atlas(해부), Achilles tendon…)
- 브랜드 어원 (Nike, Amazon, Pandora, Hermès, Ajax, Mars, Oracle, Trident, Olympus, Saturn, Janus…)
- 영어 관용구 사전의 신화·성경 유래 항목
- 유명 회화·조각 제목 (루브르·우피치·내셔널갤러리 상위 컬렉션)
- 영화·소설 제목 및 모티프 (Se7en, Troy, O Brother Where Art Thou, East of Eden, Pale Fire…)
- E.D. Hirsch *Cultural Literacy* 부록 리스트 (교차 검증용)
- 셰익스피어 유래 일상 표현 목록

## F. 앱 런타임에서 쓰는 AI
- `capture-match`: 공유된 텍스트/URL/이미지 → 기존 trace 매칭(신뢰도) / 신규 candidate 초안. JSON only.
- `tutor-hint`: 소크라테스식 3단 힌트. 시스템 프롬프트에 "원천 이름 직접 언급 금지" 하드 룰.
- `explain-grade`: `explain_allusion` 자유답 채점 (0~2점 + 한 줄 피드백).
- 모델·파라미터는 `app/lib/ai/config.ts` 단일 지점. 비용 로그 필수.

## G. 오너의 다른 프로젝트와의 관계
- **범용 학습 코어(learning-skill-system)**: 추측→힌트→답 루프와 SM-2 스케줄러는 Ariadne에 먼저 구현하되, 과목 독립적으로 `app/lib/learning/`에 격리. 나중에 코어 리포로 추출 가능하게.
- 이 격리 경계를 깨는 코드(예: 튜터 프롬프트에 신화 전용 로직 하드코딩)는 리뷰에서 지적.
