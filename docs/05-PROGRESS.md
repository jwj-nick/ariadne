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
| 마일스톤 | **M0·M1·M2 완료 · 디자인 4갈래 완료 · M3 진행 중** |
| 진행률 | M0 6/6 · M1 5/6 · M2 4/6 · 디자인 4/4 · 흔적 105 / 목표 300 |
| 마지막 세션 | 2026-09-09 (세션 "adriane", 야간 자율진행 2차) |
| 공개 주소 | **https://jwj-nick.github.io/ariadne/** |
| 다음 작업 | M3 계속. 아래 갈래별 표에서 남은 것이 많은 쪽부터 |
| 블로커 | 없음. D24·D25 로 Vercel·Supabase·AI 가 모두 보류되어 막힌 것이 사라졌다 |

### 오너가 직접 해야 하는 일 (지금 막혀 있는 것)

| # | 필요한 것 | 왜 |
|---|---|---|
| B1 | ~~Vercel 로그인~~ | **D25 로 보류.** AI 를 쓰지 않기로 해서 서버가 할 일이 없다. GitHub Pages 로 한참 간다 |
| B2 | ~~Supabase~~ | **D25 로 보류.** 학습 기록은 기기 안에만 있고, `/settings` 의 백업 내려받기로 지킨다 |
| B3 | ~~Anthropic API 키~~ | **D24 로 불필요.** 캡처 매칭도 힌트도 채점도 전부 코드와 빌드 시점 생성으로 돌아간다 |

지금 오너를 기다리는 것은 **폰에서 홈 화면에 추가하고 실제로 써 보는 일** 하나다.

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
| `/graph` | 실 지도. 흔적과 원천이 이어진 별자리. 좌표는 빌드가 계산해 굳힌다 |
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
| M2-5 | 배포, 오너 폰에 홈 화면 추가 | `[~]` | 배포는 됨. 폰에 추가하는 것은 오너 몫 |
| M2-6 | 이미지 캡처 (POST share target) | `[ ]` | Q3 답변 후 착수 |

## M3 — 콘텐츠 스케일 (D23 — 흔적 300장)

| # | 갈래 | 목표 | 지금 |
|---|---|---|---|
| M3-1 | 일상 관용구 | 60 | 30 |
| M3-2 | 브랜드 | 50 | 14 |
| M3-3 | 과학·천문 | 45 | 15 |
| M3-4 | 심리·의학 | 35 | 11 |
| M3-5 | 회화·조각 | 30 | 9 |
| M3-6 | 문학·영화 | 30 | 11 |
| M3-7 | 정치·법 | 25 | 9 |
| M3-8 | 프로젝트 코드명 | 15 | 3 |
| M3-9 | 지명 | 10 | 0 |
| M3-10 | 웹 승인 UI (candidate → published) | — | `[ ]` 아직 |

**2026-09-09 현재 분포**

| 흔적 카테고리 | 현재 | 목표 | 남은 것 |
|---|---|---|---|
| 일상 관용구 | 30 | 60 | 30 |
| 브랜드 | 14 | 50 | 36 |
| 과학·천문 | 15 | 45 | 30 |
| 심리·의학 | 11 | 35 | 24 |
| 회화·조각 | 9 | 30 | 21 |
| 문학·영화 | 11 | 30 | 19 |
| 정치·법 | 9 | 25 | 16 |
| 프로젝트 코드명 | 3 | 15 | 12 |
| 지명 | 0 | 10 | 10 |
| 그 밖 | 3 | 0 | 0 |
| **합계** | **105** | **300** | **195** |

원천 도메인: 그리스·로마 신화 50 · 역사 12 · 구약 7 · 신약 6 · 문학 5 (합계 80장)

`frequency` 는 5점 42개, 4점 48개, 3점 15개다.
마주칠 확률이 높은 것부터 채운다는 기준(Q4)을 지키고 있다.

> **다음에 카드를 이어서 쓸 때.** 위 표에서 남은 것이 많은 갈래부터 채운다.
> 기존 원천을 다시 쓰는 흔적을 섞으면 작업이 절반으로 줄고 그래프도 촘촘해진다.
> 새 카드를 넣은 뒤 `npm run check` 만 통과하면 스키마·퀴즈·문양·배치가 모두 따라온다.
> 흔적 이름이 원천 이름을 그대로 품으면 원천 맞히기 문제가 자동으로 빠지는데(D19), 이는 정상이다.

## 디자인 (D27)

| # | 갈래 | 상태 | 어디에 |
|---|---|---|---|
| A | 원천 문양 | `[x]` 2026-09-08 | 문양 40종. 원천 카드 머리, 흔적 카드의 원천 상자, 목록의 모든 항목, 실 지도의 점 |
| B | 정답 순간의 실 애니메이션 | `[x]` 2026-09-08 | 퀴즈에서 답을 열면 흔적에서 원천으로 실이 그려진다 |
| C | 원천 그래프 | `[x]` 2026-09-08 | `/graph`. 끌기·확대·점 고르기 |
| D | 미궁 진도 | `[x]` 2026-09-08 | 홈 맨 위와 `/settings`. 바깥에서 가운데로 감기는 실 |

문양을 새로 그릴 때는 두 곳을 함께 고친다.
그림은 `app/components/Emblem.tsx`, 검사용 목록은 `scripts/lib/schema.ts` 의 `EMBLEM_NAMES` 다.
`tests/emblem.test.ts` 가 둘이 어긋나지 않았는지 확인한다.

## M4 — 가족·공개

| # | 작업 | 상태 | 비고 |
|---|---|---|---|
| M4-1 | 아이 계정 온보딩, kid 전용 모드 | `[~]` | 눈높이 전환은 M1-5 에서 됨. 계정은 D25 로 보류 |
| M4-2 | 그래프 뷰 | `[x]` 2026-09-08 | `/graph` 실 지도 (D27-C) |
| M4-3 | 퀴즈 타입 확장 | `[~]` | 원천 맞히기·이유 말하기 두 갈래. 나머지는 미착수 |
| M4-4 | 공개 범위 결정(Q2) 후 초대제 공개 | `[ ]` | D25 로 지금은 공개 URL 유지 |

---

## 세션 로그

| 날짜 | 세션 | 한 일 | 다음 |
|---|---|---|---|
| 2026-09-06 | claude.ai 모바일 | 설계 Round 1~3, 리포 골격 문서 5종 + 스킬 4종 초안 | Claude Code로 이관 |
| 2026-09-07 | adriane (Claude Code) | OPEN Q 추천안 제시 → Q1·Q5 확정. git init + public 리포. 스키마 도메인·섹션 제목 규약 확정(D12~D18). `validate.ts`·`build.ts`·검사기 17건 테스트 작성. 시드 2장(Nike, Ariadne's thread) | M0-4 시드 18장 |
| 2026-09-08 | adriane (야간 자율진행) | M0-4~M0-6 완주 후 M1 학습 루프 완성. 시드 23장, 앱 5화면, 퀴즈 58문, 단위 57건·E2E 24건 | M2 조우 캡처 |
| 2026-09-09 | adriane (야간 자율진행 2차) | 캡처 버그 수정. 디자인 네 갈래 완성(문양 40종·실 애니메이션·실 지도·미궁 진도). 콘텐츠 42→105장. 검사 W07·W08 추가 | M3 계속 (남은 195장) |
