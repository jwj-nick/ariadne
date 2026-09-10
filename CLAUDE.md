# Ariadne (아리아드네) — CLAUDE.md

> 미궁 속 테세우스에게 실타래를 건넨 아리아드네처럼,
> 현대 생활 곳곳에 흩어진 서양 문화의 흔적(trace)에서 원천(source)까지 실을 이어 주는 앱.
> 프로젝트 이름 자체가 첫 번째 카드다: `trace:ariadne-thread` → `source:ariadne`.

## 0. 먼저 읽을 것
1. `docs/00-MISSION.md` — 왜 만드는가, 진짜 목표 (변경 시 반드시 오너 승인)
2. `docs/01-DESIGN-LOG.md` — 오너와 Claude가 나눈 설계 대화 전체 기록 + 결정 사항
3. `docs/02-SCHEMA.md` — trace/source 노드 스키마, 링크 규칙
4. `docs/03-SKILLS-TOOLS.md` — 이 리포에서 쓰는 스킬·툴·MCP 목록과 역할
5. `docs/04-ROADMAP.md` — v1 마일스톤 (계획의 정본)
6. `docs/05-PROGRESS.md` — **진행 체크리스트 (진행 상태의 정본). 세션을 시작하면 여기 "다음 작업"부터 읽는다.**

## 1. 한 줄 정의
**흔적(trace) → 원천(source)** 방향의 서양 교양 학습·조회·퀴즈 웹앱.
학습 단위는 "제우스 이야기"가 아니라 **"오늘 본 로고·용어·행성·그림·영화 뒤에 무엇이 있나"**다.

## 2. 절대 원칙 (Non-negotiables)
- **흔적이 1차 키다.** 원천(신화·성경·역사·문학)은 흔적에서 도달하는 목적지. 원천만 있는 카드는 "고아"이며 링크 감사에서 경고한다.
- **모델의 이름과 화면의 말을 가른다 (D33).** 코드·URL·`content/` 폴더에서는 `trace`/`source`(흔적/원천)를
  그대로 쓰되, **사용자가 보는 자리에서는 "이름"과 "이야기"로 부른다.** 화면 문구에 "흔적", "원천", "조우",
  "갈래" 같은 내부 용어를 그대로 올리지 않는다. 앱을 쓰려면 앱의 어휘부터 배워야 하는 상태가 되기 때문이다.
- **현대인의 실제 삶에 집중.** 브랜드, 제품·프로젝트 코드명, 과학·천문 용어, 심리·의학 용어, 회화·조각, 소설·영화, 정치·법 용어, 일상 관용구. 학술적 완결성보다 "마주칠 확률"이 우선.
- **생성 효과 우선.** 튜터/퀴즈는 정답을 먼저 보여주지 않는다. 사용자가 추측 → 힌트 → 답 → 카드 순서. 이 순서를 깨는 UI/프롬프트는 리젝.
- **조우 캡처(encounter capture)가 핵심 입력.** 앉아서 공부가 아니라 방송·책·거리에서 마주친 순간의 캡처가 학습 트리거다.
- **가족·비서양권 성인 대상.** 카드마다 2단 레벨(kid/adult), 한·영 병기, 가능하면 한국 문화 대응물 1줄.
- **오너가 큐레이터.** 자동 생성 콘텐츠는 `candidate` 상태로 큐잉되고, 웹 UI 승인 후에만 `published`가 된다. Claude Code가 직접 `published`로 쓰지 않는다.
- **오너는 CLI에서 콘텐츠를 보지 않는다.** 콘텐츠 검토·조회·퀴즈는 전부 웹앱에서. CLI는 파이프라인·코드·빌드 전용.

## 3. 리포 구조
```
ariadne/
├── CLAUDE.md
├── docs/                    # 미션·설계로그·스키마·로드맵
├── content/
│   ├── traces/<category>/<slug>.md    # 흔적 노드 (Markdown + YAML frontmatter)
│   ├── sources/<domain>/<slug>.md     # 원천 노드
│   └── candidates/                     # 승인 대기 (harvester 출력)
├── scripts/                 # build(md→json), validate, harvest, seed
├── app/                     # Next.js (App Router) + Supabase + PWA
├── .claude/
│   ├── skills/              # trace-harvester, card-author, quiz-generator, link-auditor
│   └── commands/            # /harvest, /author, /audit, /build
└── tests/
```

## 4. 기술 스택 (v1 결정)
- **Web:** Next.js (App Router, TypeScript), Tailwind. 모바일 우선 반응형.
- **PWA:** `manifest.json` + service worker. **Web Share Target API** 필수 — 폰 공유 시트에서 텍스트/URL/이미지를 앱으로 던지는 것이 캡처 흐름의 시작.
- **Backend:** Supabase (Auth: 가족 계정, Postgres: 사용자별 SM-2 상태·캡처·퀴즈 로그, Storage: 캡처 이미지).
- **콘텐츠:** git 리포 Markdown이 원본. `scripts/build`가 JSON으로 빌드해 앱에 번들. Supabase에는 콘텐츠 원본을 두지 않는다 (사용자 상태만).
- **AI:** Anthropic API. 용도 = (a) 캡처 → 흔적 매칭/신규 후보 생성, (b) 소크라테스식 힌트 튜터, (c) 퀴즈 변형 생성. 모델은 `app/lib/ai/config.ts` 한 곳에서만 지정.
- **배포:** Vercel + Supabase 클라우드.
- **복습 알고리즘:** SM-2 (오너가 이미 다른 프로젝트에서 검증한 방식). 카드별이 아니라 **trace별** 스케줄.

## 5. 콘텐츠 규칙 (요약 — 상세는 docs/02-SCHEMA.md)
- 파일명 = slug, 영문 kebab-case. 예: `traces/brand/nike.md`, `sources/greek-myth/nike-goddess.md`
- 모든 trace는 `sources: []`에 최소 1개 링크, `why: ` (왜 이 이름이 붙었나, 1문장) 필수.
- 본문 순서 고정: **한 줄 정의 → 3문장 스토리 → 왜 알아야 하나 → 연결 → 한국 대응물(선택)**.
- `level_kid`, `level_adult` 두 요약 모두 필수. 한국어 본문 + 영어 키워드 병기.
- 출처는 공개·검증 가능한 것만. 저작권 텍스트(성경 번역본 장문, 시, 가사) 인용 금지 — 요약·패러프레이즈만.
- 신학적·정치적 논쟁 회피. 교양 지식으로서의 서술만 (예: 성경은 "서양 문학·언어의 원천 텍스트"로 다룬다).

## 6. 작업 방식
- 새 작업은 `docs/01-DESIGN-LOG.md`의 결정 사항과 충돌하는지 먼저 확인. 충돌하면 코드 쓰기 전에 오너에게 질문.
- 콘텐츠 대량 생성은 반드시 `trace-harvester` → `card-author` → `link-auditor` 순서. 감사 통과 못 한 카드는 `candidates/`에 남긴다.
- 커밋 메시지: `content:`, `app:`, `scripts:`, `docs:` prefix.
- **작업을 끝낼 때마다 `docs/05-PROGRESS.md`의 해당 항목을 `[x]`로 바꾸고 완료일을 적는다.**
  세션을 끝낼 때는 05의 "현재 위치" 표와 "세션 로그"를 갱신한다. 새 결정은 05가 아니라 01의 DECISIONS 표에 적는다.
- 오너에게 보고할 때: 짧고 명료하게. 다음 결정이 필요한 질문을 1~3개 붙인다. 오너는 AI가 개선 방향을 먼저 제안하는 것을 선호한다.
- 오너와의 대화는 한국어 + 영문 기술용어.

## 7. 하지 말 것
- 원천 중심 커리큘럼(연대기적 신화 강의)으로 되돌아가지 않는다.
- 퀴즈에서 정답 노출 후 질문하지 않는다.
- 카드에 "왜 알아야 하나"가 비어 있으면 publish 불가.
- 캡처 없이도 잘 돌아가는 앱을 먼저 만들지 않는다 — 캡처는 v1 범위다.
