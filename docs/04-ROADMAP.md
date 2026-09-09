# 04. ROADMAP — v1

목표: **오너가 폰에서 캡처하고, 저녁에 퀴즈 풀고, 아이가 kid 퀴즈를 혼자 푸는 상태**를 최단 경로로.

> 이 문서는 **계획의 정본**이다. "지금 어디까지 왔나"는 `05-PROGRESS.md`에서 관리한다.
> 아래 체크박스는 마일스톤 단위의 개요이고, 세부 진행표는 05에 있다.

> **표시 규약.** `[x]` 완료, `[~]` 부분 완료이거나 결정으로 보류, `[ ]` 미착수.
> 보류의 근거는 `01-DESIGN-LOG.md` 의 DECISIONS 표에 있다.

## M0 — 리포 부트스트랩 (첫 세션, 1~2시간)
- [x] git 초기화 + public 원격 리포 (`github.com/jwj-nick/ariadne`)
- [x] 이 문서들 읽고 OPEN QUESTIONS(01-DESIGN-LOG 하단) 오너에게 확인 — Q1·Q5 해결
- [x] `scripts/validate.ts`, `scripts/build.ts` (md → graph.json)
- [x] 시드 카드 20장 수작업 (아래 목록) — 스키마 검증용. `status: reviewed` (D15)
- [x] Next.js 앱 골격 + graph.json 로드 + 조회 화면(검색만)
- [x] 배포 — https://jwj-nick.github.io/ariadne/ (Vercel 은 로그인 필요, 05-PROGRESS B1 참조)

> **Supabase는 M0에 없다.** D14에 따라 M1 후반에 도입하고, 그 전까지는 `localStorage`를 쓴다.
> 견적 1~2시간은 낙관적이었다. 시드 20장을 스키마대로 쓰는 분량 때문에 실제로는 2~3세션으로 본다.

**시드 20 (trace → source):**
Nike→니케 / Amazon→아마존족 / Pandora(앱·상자)→판도라 / Apollo 계획→아폴론 / Artemis 계획→아르테미스 /
Trojan(바이러스)→트로이 목마 / Titan(로켓·위성)→티탄 / Atlas(지도책·로켓)→아틀라스 / 목성 Jupiter→유피테르·제우스 /
Europa(위성)→에우로페 / narcissism→나르키소스 / mentor→멘토르 / nemesis→네메시스 / Achilles heel→아킬레우스 /
Se7en(영화)→7대 죄악 / prodigal son→돌아온 탕자 / Judas kiss→유다 / Good Samaritan→선한 사마리아인 /
Ariadne's thread→아리아드네 / Oracle(회사)→델포이 신탁

## M1 — 학습 루프 (1~2주)
- [x] SM-2 스케줄러 (`app/lib/learning/`, 과목 독립)
- [x] 퀴즈 화면: 추측 → 힌트 → 답 → 카드. 힌트는 빌드 시점 생성이고 AI 를 부르지 않는다 (D17·D24)
- [x] 저장 계층 `app/lib/store/` 인터페이스 + localStorage 구현 (D14)
- [~] Supabase Auth(가족 계정) + review_state — **D25 로 보류.** 저장 계층 인터페이스는 그대로 두어 나중에 끼울 수 있다
- [x] kid/adult 토글

## M2 — 조우 캡처 (1주)
- [x] PWA manifest + Web Share Target (텍스트·URL. 이미지는 Q3 답변 후)
- [x] 캡처 매칭 — **AI 없이 로컬 글자 매칭** (D20·D24). 원천 이름으로도 흔적을 찾아 준다 (D26)
- [x] "오늘의 조우" 화면 + 캡처가 당일 퀴즈 데크에 편입
- [~] 배포 완료(GitHub Pages, D25). **폰에 홈 화면 추가는 오너 몫**

## M3 — 콘텐츠 스케일 (병렬, 2~3주)
- [x] 갈래별 목표치를 정하고 그 안에서 채우기 (D23). 관용구 60 · 브랜드 50 · 과학천문 45 ·
      심리의학 35 · 회화조각 30 · 문학영화 30 · 정치법 25 · 코드명 15 · 지명 10
- [x] 감사 통과 — error 0 · warn 0
- [ ] 웹 승인 UI (candidate → published) — 캡처에서 후보가 쌓이기 시작하면
- [x] 목표: **trace 300 / source 120 / 고아 0** (D23 이 200 을 300 으로 올렸다) → 303 / 179 / 0

## M4 — 가족·공개 (그 이후)
- [~] 눈높이 전환은 완료. 계정은 D25 로 보류
- [x] 그래프 뷰 — `/graph` 실 지도 (D27-C)
- [~] 이유 말하기(`explain_why`)는 완료. 이미지·대응물 퀴즈는 미착수
- [~] D25 로 지금은 공개 URL 을 그대로 유지한다

## 측정 (M1부터 로그)
- 주간 캡처 수, 퀴즈 정답률(타입별), 힌트 사용 횟수, 3개월 후 "즉답 가능" 흔적 수.

## 디자인 (D27, 라운드 6~7에 추가된 줄기)
- [x] A 원천 문양 — 66종. 카드·목록·실 지도에 붙는다
- [x] B 정답 순간의 실 애니메이션
- [x] C 원천 그래프 — `/graph` 실 지도
- [x] D 미궁 진도 — 홈과 진도 화면
- [x] E 삼백 장에 맞춘 손질 — 배치 자동 축척, 목록 나눠 그리기

## 앱 → 리포 되돌리기 (D28, 라운드 7)
- [x] 카드 요청서 — 더 알고 싶은 것을 담아 개발 도구에 붙여 넣을 글로 뽑는다
- [x] 캡처의 후보가 요청서로 바로 이어진다
