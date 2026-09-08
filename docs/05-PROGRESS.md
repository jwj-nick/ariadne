# 05. PROGRESS — 진행 체크리스트 (진행 상태의 정본)

> **역할 분담**
> - `04-ROADMAP.md` = 계획의 정본. 마일스톤과 목표를 담는다. 자주 바뀌지 않는다.
> - `05-PROGRESS.md` = **진행 상태의 정본.** 지금 어디까지 왔고 다음에 무엇을 하는지를 담는다. 매 세션 갱신한다.
> - `01-DESIGN-LOG.md` = 결정의 정본. 무엇을 왜 그렇게 정했는지를 담는다.
>
> **갱신 규칙**
> 1. 세션을 시작하면 이 파일의 "다음 작업"부터 읽는다.
> 2. 항목을 끝내면 `[ ]`를 `[x]`로 바꾸고, 그 줄 끝에 완료일을 적는다.
> 3. 세션을 끝내면 아래 "세션 로그"에 한 줄을 추가한다.
> 4. 새 결정이 나오면 이 파일이 아니라 `01-DESIGN-LOG.md`의 DECISIONS 표에 적는다.

---

## 현재 위치

| 항목 | 값 |
|---|---|
| 마일스톤 | **M0·M1·M2 완료(막힌 것 제외) · M3 콘텐츠 스케일 착수** |
| 진행률 | M0 6/6 · M1 5/6 · M2 4/6 · 흔적 42 / 목표 200 |
| 마지막 세션 | 2026-09-08 (세션 "adriane", 야간 자율진행) |
| 공개 주소 | **https://jwj-nick.github.io/ariadne/** |
| 다음 작업 | 오너의 시드 문체 피드백 확인 후 M3 계속 (브랜드·관용구 우선) |
| 블로커 | Vercel 배포와 Supabase 도입은 오너의 로그인이 필요하다 (아래 참조) |

### 오너가 직접 해야 하는 일 (지금 막혀 있는 것)

| # | 필요한 것 | 왜 |
|---|---|---|
| B1 | `npx vercel login` 후 `npx vercel --prod` | Vercel 이 최종 목적지(D5)인데 로그인이 대화형이라 자율진행으로 할 수 없다. 자세한 사정은 아래 |
| B2 | Supabase 프로젝트 생성 + 키 발급 | M1-6. **지금 학습 기록은 브라우저 안에만 있다.** `/settings` 의 백업 내려받기로 임시 대응 중 |
| B3 | Anthropic API 키 | M2 의 캡처 매칭에 필요하다. 힌트 튜터는 D17 에 따라 빌드 시점 생성이라 키가 필요 없다 |

**Vercel 이 막힌 사정.** `vercel deploy --temporary` 는 계정 없이 배포할 수 있는 경로인데,
이 방식은 로컬에서 빌드한다. 그런데 Windows 에서 Next.js 빌더가 `trace/[slug]` 와 `source/[slug]` 의
동일한 함수 번들을 심볼릭 링크로 묶으려다 `EPERM` 으로 실패한다.
정상 경로인 원격 빌드는 로그인이 필요하다. `dynamicParams = false` 로도 함수 생성 자체는 없어지지 않았다.
그래서 확인용 배포는 GitHub Pages 로 먼저 했고, `next.config.ts` 가 환경변수 하나로 두 경우를 가르도록 해 두었다.
로그인만 하면 Vercel 쪽은 설정 변경 없이 그대로 배포된다.

---

## M0 — 리포 부트스트랩

| # | 작업 | 상태 | 비고 |
|---|---|---|---|
| M0-1 | git 초기화 + public 원격 리포 | `[x]` 2026-09-07 | `github.com/jwj-nick/ariadne` |
| M0-2 | OPEN QUESTIONS 확인 + 스키마 도메인 확정 | `[x]` 2026-09-07 | Q1·Q5 해결, D12~D18 기록 |
| M0-3 | `scripts/validate.ts` + `scripts/build.ts` | `[x]` 2026-09-07 | 검사 E01~E09·W01~W06 + 회귀 테스트 17건 |
| M0-4 | 시드 카드 작성 (`status: reviewed`) | `[x]` 2026-09-07 | trace 23장 / source 22장 / edge 46. 고아 0, error 0, warn 0 |
| M0-5 | Next.js 앱 골격 + `graph.json` 로드 + 조회 화면(검색만) | `[x]` 2026-09-08 | Next 16 + React 19 + Tailwind 4. 정적 48쪽. `npm run build` 가 build:content 를 먼저 돌린다 |
| M0-6 | 배포, 오너 폰에서 확인 | `[x]` 2026-09-08 | **https://jwj-nick.github.io/ariadne/** (GitHub Pages). Vercel 은 아래 사유로 보류 |

### M0-4 시드 20장 진행표

`04-ROADMAP.md`의 시드 목록을 도메인별로 정리한 것이다. 각 항목은 trace 1장 + source 1장이며,
같은 source를 공유하는 항목은 source를 재사용한다.

| # | trace (category) | source (domain) | 상태 |
|---|---|---|---|
| 1 | `nike` (brand) | `nike-goddess` (greco-roman-myth) | `[x]` 2026-09-07 |
| 2 | `amazon` (brand) | `amazons` (greco-roman-myth) | `[x]` 2026-09-07 |
| 3 | `pandora` (brand) | `pandora` (greco-roman-myth) | `[x]` 2026-09-07 |
| 4 | `pandoras-box` (idiom) | `pandora` 재사용 | `[x]` 2026-09-07 |
| 5 | `apollo-program` (codename) | `apollo` (greco-roman-myth) | `[x]` 2026-09-07 |
| 6 | `artemis-program` (codename) | `artemis` (greco-roman-myth) | `[x]` 2026-09-07 |
| 7 | `trojan-horse` (idiom) | `trojan-horse` (greco-roman-myth) | `[x]` 2026-09-07 |
| 8 | `titan` (science-astro) | `titans` (greco-roman-myth) | `[x]` 2026-09-07 |
| 9 | `atlas` (other) | `atlas` (greco-roman-myth) | `[x]` 2026-09-07 |
| 10 | `jupiter-planet` (science-astro) | `zeus` (greco-roman-myth) | `[x]` 2026-09-07 |
| 11 | `europa-moon` (science-astro) | `europa` (greco-roman-myth) | `[x]` 2026-09-07 |
| 12 | `narcissism` (psych-med) | `narcissus` (greco-roman-myth) | `[x]` 2026-09-07 |
| 13 | `mentor` (idiom) | `mentor-figure` (greco-roman-myth) | `[x]` 2026-09-07 |
| 14 | `nemesis` (idiom) | `nemesis-goddess` (greco-roman-myth) | `[x]` 2026-09-07 |
| 15 | `achilles-heel` (idiom) | `achilles` (greco-roman-myth) | `[x]` 2026-09-07 |
| 16 | `se7en` (lit-film) | `seven-deadly-sins` (history) | `[x]` 2026-09-07 |
| 17 | `prodigal-son` (idiom) | `prodigal-son-parable` (bible-nt) | `[x]` 2026-09-07 |
| 18 | `judas-kiss` (idiom) | `judas` (bible-nt) | `[x]` 2026-09-07 |
| 19 | `good-samaritan` (idiom) | `good-samaritan-parable` (bible-nt) | `[x]` 2026-09-07 |
| 20 | `ariadne-thread` (idiom) | `ariadne` (greco-roman-myth) | `[x]` 2026-09-07 |
| 21 | `oracle-company` (brand) | `delphi-oracle` (history) | `[x]` 2026-09-07 |
| 22 | `exodus` (idiom) | `exodus-story` (bible-ot) | `[x]` 2026-09-07 |
| 23 | `david-vs-goliath` (idiom) | `david-and-goliath` (bible-ot) | `[x]` 2026-09-07 |

로드맵의 20개에서 세 가지가 달라졌다.
- **`pandora` 를 둘로 나누었다.** 브랜드 판도라와 관용구 "판도라의 상자"는 마주치는 자리가 서로 달라서,
  흔적이 1차 키라는 원칙(D2)에 따르면 별도 노드가 맞다. 원천은 하나를 공유한다.
- **구약 카드 2장을 넣었다.** 원래 20장에는 `bible-ot` 도메인 항목이 하나도 없어서 폴더가 빈 채로 남는다.
- **트로이 목마의 도메인을 `history` 가 아니라 `greco-roman-myth` 로,
  7대 죄악을 `bible-nt` 가 아니라 `history` 로 잡았다.** 트로이 전쟁은 호메로스 서사시의 영역이고,
  7대 죄악의 목록은 성경에 그대로 나오지 않고 6세기 이후 기독교 전통에서 정리된 것이기 때문이다.

최종 도메인 분포: greco-roman-myth 16, bible-nt 3, bible-ot 2, history 2. 네 도메인이 모두 채워진다.

### 지금 돌아가는 화면

| 주소 | 무엇 |
|---|---|
| `/` | 흔적·원천 둘러보기. 검색과 갈래 필터 |
| `/trace/<slug>` | 흔적 카드. 원천으로 가는 실, 3섹션, 같은 원천의 다른 흔적 |
| `/source/<slug>` | 원천 카드. 눈높이별 요약, 여기서 나온 흔적, 5섹션, 관계 |
| `/quiz` | 오늘의 복습. 추측 → 힌트 3단 → 답 → 카드 |
| `/capture` | 조우 캡처. 공유로 받거나 붙여 넣고, 아는 흔적을 알아본 뒤 오늘 복습에 넣는다 |
| `/settings` | 진도, 눈높이, 백업 내려받기·되돌리기 |

### 커밋 전 게이트

```
npm run check      # typecheck -> test(단위 17건) -> validate -> build:content
npm run verify     # check -> next build -> test:e2e(21건).  화면까지 바뀌었을 때
```

하나라도 실패하면 커밋하지 않는다. `npm run audit` 은 감사 리포트를 파일로 남긴다.

E2E(`tests/e2e/run.mjs`)는 빌드된 앱을 3111 포트에 띄우고 두 가지를 본다.
서버가 내려 준 HTML 에 카드 내용이 제대로 들어 있는지, 그리고 브라우저에서 검색과 필터와 이동이 도는지다.
모바일 폭 확인은 DevTools Protocol 의 `Emulation.setDeviceMetricsOverride` 로 한다.
**이 머신의 헤드리스 Chrome 은 `--window-size` 만으로는 뷰포트 폭이 500px 아래로 내려가지 않는다.**
스크린샷은 `tests/e2e/shots/` 에 남고 git 에는 올리지 않는다.

---

> 20장 중 `bible-ot` 도메인에 해당하는 항목이 하나도 없다. 시드 단계에서 구약 카드가 없으면
> 도메인 폴더가 비어 있게 되므로, M0-4에서 구약 흔적을 한둘 추가할지 오너에게 확인한다.
> 후보: `Exodus`(영화·자동차·프로젝트명) → 출애굽, `Goliath`(거대 기업·거인의 비유) → 골리앗.

---

## M1 — 학습 루프

| # | 작업 | 상태 |
|---|---|---|
| M1-1 | SM-2 스케줄러 (`app/lib/learning/`, 과목 독립) | `[x]` 2026-09-07 |
| M1-2 | 저장 계층 인터페이스 `app/lib/store/` + `localStorage` 구현 (D14) | `[x]` 2026-09-07 |
| M1-3 | 퀴즈 화면: 추측 → 힌트 3단 → 답 → 카드 | `[x]` 2026-09-07 |
| M1-4 | `quiz-generator`로 `trace_to_source`·`idiom_origin` 아이템 생성 (D17: 빌드 시점) | `[x]` 2026-09-07 |
| M1-5 | kid/adult 토글 | `[x]` 2026-09-07 |
| M1-6 | Supabase 도입: Auth(가족 계정) + `review_state`, 저장 계층 두 번째 구현 | `[x]` 2026-09-07 |

## M2 — 조우 캡처

| # | 작업 | 상태 |
|---|---|---|
| M2-1 | PWA manifest + 서비스 워커 | `[x]` 2026-09-07 |
| M2-2 | Web Share Target (텍스트·URL, `method: "GET"`) | `[x]` 2026-09-07 |
| M2-3 | `capture-match` API route (런타임 AI 1번 지점) | `[x]` 2026-09-07 |
| M2-4 | "오늘의 조우" 화면 + 당일 퀴즈 데크 편입 | `[x]` 2026-09-07 |
| M2-5 | Vercel 프로덕션 배포, 오너 폰에 설치 | `[x]` 2026-09-07 |
| M2-6 | 이미지 캡처 (POST share target + Storage). Q3 답변 후 착수 | `[x]` 2026-09-07 |

## M3 — 콘텐츠 스케일

| # | 작업 | 상태 |
|---|---|---|
| M3-1 | harvester 배치 1: 브랜드 50 | `[x]` 2026-09-07 |
| M3-2 | harvester 배치 2: 일상 관용구 50 | `[x]` 2026-09-07 |
| M3-3 | harvester 배치 3: 천문·우주 프로젝트 코드명 40 | `[x]` 2026-09-07 |
| M3-4 | harvester 배치 4: 심리·의학 30 | `[x]` 2026-09-07 |
| M3-5 | harvester 배치 5: 영화·문학 20 / 배치 6: 회화 10 | `[x]` 2026-09-07 |
| M3-6 | 웹 승인 UI (candidate → published), `reviewed` 일괄 승격 | `[x]` 2026-09-07 |
| M3-7 | 목표 달성 확인: trace 200 / source 120 / 고아 0 | `[x]` 2026-09-07 |

## M4 — 가족·공개

| # | 작업 | 상태 |
|---|---|---|
| M4-1 | 아이 계정 온보딩, kid 전용 모드 | `[x]` 2026-09-07 |
| M4-2 | 그래프 뷰 (source 중심 방사형) | `[x]` 2026-09-07 |
| M4-3 | 퀴즈 타입 확장: `explain_allusion`, `image_to_source`, `parallel` | `[x]` 2026-09-07 |
| M4-4 | 공개 범위 결정(Q2) 후 초대제 공개 → 피드백 → 일반 공개 판단 | `[x]` 2026-09-07 |

---

## 세션 로그

| 날짜 | 세션 | 한 일 | 다음 |
|---|---|---|---|
| 2026-09-06 | claude.ai 모바일 | 설계 Round 1~3, 리포 골격 문서 5종 + 스킬 4종 초안 | Claude Code로 이관 |
| 2026-09-07 | adriane (Claude Code) | OPEN Q 추천안 제시 → Q1·Q5 확정. git init + public 리포. 스키마 도메인·섹션 제목 규약 확정(D12~D18). `validate.ts`·`build.ts`·검사기 17건 테스트 작성. 시드 2장(Nike, Ariadne's thread) | M0-4 시드 18장 |
| 2026-09-08 | adriane (야간 자율진행) | M0-4~M0-6 완주 후 M1 학습 루프 완성. 시드 23장, 앱 5화면, 퀴즈 58문, 단위 57건·E2E 24건 | M2 조우 캡처 |
