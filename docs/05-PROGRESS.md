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
| 마일스톤 | **M0 — 리포 부트스트랩** |
| 진행률 | 4/6 단계 |
| 마지막 세션 | 2026-09-07 (세션 "adriane") |
| 다음 작업 | **M0-4. 시드 20장 작성** (아래 참조) |
| 블로커 | 없음. 단 Q6(시드 status)에 오너 답이 있으면 좋다 |

---

## M0 — 리포 부트스트랩

| # | 작업 | 상태 | 비고 |
|---|---|---|---|
| M0-1 | git 초기화 + public 원격 리포 | `[x]` 2026-09-07 | `github.com/jwj-nick/ariadne` |
| M0-2 | OPEN QUESTIONS 확인 + 스키마 도메인 확정 | `[x]` 2026-09-07 | Q1·Q5 해결, D12~D18 기록 |
| M0-3 | `scripts/validate.ts` + `scripts/build.ts` | `[x]` 2026-09-07 | 검사 E01~E09·W01~W06 + 회귀 테스트 17건 |
| M0-4 | 시드 20장 작성 (`status: reviewed`) | `[ ]` | 픽스처 2장 완료, 18장 남음 |
| M0-5 | Next.js 앱 골격 + `graph.json` 로드 + 조회 화면(검색만) | `[ ]` | D18: 루트가 Next.js 프로젝트 |
| M0-6 | Vercel 프리뷰 배포, 오너 폰에서 확인 | `[ ]` | |

### M0-4 시드 20장 진행표

`04-ROADMAP.md`의 시드 목록을 도메인별로 정리한 것이다. 각 항목은 trace 1장 + source 1장이며,
같은 source를 공유하는 항목은 source를 재사용한다.

| # | trace | source | domain | 상태 |
|---|---|---|---|---|
| 1 | Nike (브랜드) | 니케 | greco-roman-myth | `[x]` 2026-09-07 |
| 2 | Amazon (브랜드) | 아마존족 | greco-roman-myth | `[ ]` |
| 3 | Pandora (브랜드·관용구) | 판도라 | greco-roman-myth | `[ ]` |
| 4 | Apollo 계획 | 아폴론 | greco-roman-myth | `[ ]` |
| 5 | Artemis 계획 | 아르테미스 | greco-roman-myth | `[ ]` |
| 6 | Trojan (악성코드) | 트로이 목마 | history | `[ ]` |
| 7 | Titan (로켓·위성) | 티탄 | greco-roman-myth | `[ ]` |
| 8 | Atlas (지도책·로켓) | 아틀라스 | greco-roman-myth | `[ ]` |
| 9 | 목성 Jupiter | 유피테르(제우스) | greco-roman-myth | `[ ]` |
| 10 | Europa (위성) | 에우로페 | greco-roman-myth | `[ ]` |
| 11 | narcissism | 나르키소스 | greco-roman-myth | `[ ]` |
| 12 | mentor | 멘토르 | greco-roman-myth | `[ ]` |
| 13 | nemesis | 네메시스 | greco-roman-myth | `[ ]` |
| 14 | Achilles heel | 아킬레우스 | greco-roman-myth | `[ ]` |
| 15 | Se7en (영화) | 7대 죄악 | bible-nt | `[ ]` |
| 16 | prodigal son | 돌아온 탕자 | bible-nt | `[ ]` |
| 17 | Judas kiss | 유다 | bible-nt | `[ ]` |
| 18 | Good Samaritan | 선한 사마리아인 | bible-nt | `[ ]` |
| 19 | Ariadne's thread | 아리아드네 | greco-roman-myth | `[x]` 2026-09-07 |
| 20 | Oracle (회사) | 델포이 신탁 | history | `[ ]` |

### 커밋 전 게이트

```
npm run check      # typecheck → test → validate → build:content
```

네 단계 중 하나라도 실패하면 커밋하지 않는다. `npm run audit` 은 감사 리포트까지 파일로 남긴다.

---

> 20장 중 `bible-ot` 도메인에 해당하는 항목이 하나도 없다. 시드 단계에서 구약 카드가 없으면
> 도메인 폴더가 비어 있게 되므로, M0-4에서 구약 흔적을 한둘 추가할지 오너에게 확인한다.
> 후보: `Exodus`(영화·자동차·프로젝트명) → 출애굽, `Goliath`(거대 기업·거인의 비유) → 골리앗.

---

## M1 — 학습 루프

| # | 작업 | 상태 |
|---|---|---|
| M1-1 | SM-2 스케줄러 (`app/lib/learning/`, 과목 독립) | `[ ]` |
| M1-2 | 저장 계층 인터페이스 `app/lib/store/` + `localStorage` 구현 (D14) | `[ ]` |
| M1-3 | 퀴즈 화면: 추측 → 힌트 3단 → 답 → 카드 | `[ ]` |
| M1-4 | `quiz-generator`로 `trace_to_source`·`idiom_origin` 아이템 생성 (D17: 빌드 시점) | `[ ]` |
| M1-5 | kid/adult 토글 | `[ ]` |
| M1-6 | Supabase 도입: Auth(가족 계정) + `review_state`, 저장 계층 두 번째 구현 | `[ ]` |

## M2 — 조우 캡처

| # | 작업 | 상태 |
|---|---|---|
| M2-1 | PWA manifest + 서비스 워커 | `[ ]` |
| M2-2 | Web Share Target (텍스트·URL, `method: "GET"`) | `[ ]` |
| M2-3 | `capture-match` API route (런타임 AI 1번 지점) | `[ ]` |
| M2-4 | "오늘의 조우" 화면 + 당일 퀴즈 데크 편입 | `[ ]` |
| M2-5 | Vercel 프로덕션 배포, 오너 폰에 설치 | `[ ]` |
| M2-6 | 이미지 캡처 (POST share target + Storage). Q3 답변 후 착수 | `[ ]` |

## M3 — 콘텐츠 스케일

| # | 작업 | 상태 |
|---|---|---|
| M3-1 | harvester 배치 1: 브랜드 50 | `[ ]` |
| M3-2 | harvester 배치 2: 일상 관용구 50 | `[ ]` |
| M3-3 | harvester 배치 3: 천문·우주 프로젝트 코드명 40 | `[ ]` |
| M3-4 | harvester 배치 4: 심리·의학 30 | `[ ]` |
| M3-5 | harvester 배치 5: 영화·문학 20 / 배치 6: 회화 10 | `[ ]` |
| M3-6 | 웹 승인 UI (candidate → published), `reviewed` 일괄 승격 | `[ ]` |
| M3-7 | 목표 달성 확인: trace 200 / source 120 / 고아 0 | `[ ]` |

## M4 — 가족·공개

| # | 작업 | 상태 |
|---|---|---|
| M4-1 | 아이 계정 온보딩, kid 전용 모드 | `[ ]` |
| M4-2 | 그래프 뷰 (source 중심 방사형) | `[ ]` |
| M4-3 | 퀴즈 타입 확장: `explain_allusion`, `image_to_source`, `parallel` | `[ ]` |
| M4-4 | 공개 범위 결정(Q2) 후 초대제 공개 → 피드백 → 일반 공개 판단 | `[ ]` |

---

## 세션 로그

| 날짜 | 세션 | 한 일 | 다음 |
|---|---|---|---|
| 2026-09-06 | claude.ai 모바일 | 설계 Round 1~3, 리포 골격 문서 5종 + 스킬 4종 초안 | Claude Code로 이관 |
| 2026-09-07 | adriane (Claude Code) | OPEN Q 추천안 제시 → Q1·Q5 확정. git init + public 리포. 스키마 도메인·섹션 제목 규약 확정(D12~D18). `validate.ts`·`build.ts`·검사기 17건 테스트 작성. 시드 2장(Nike, Ariadne's thread) | M0-4 시드 18장 |
