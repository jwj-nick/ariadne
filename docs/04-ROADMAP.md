# 04. ROADMAP — v1

목표: **오너가 폰에서 캡처하고, 저녁에 퀴즈 풀고, 아이가 kid 퀴즈를 혼자 푸는 상태**를 최단 경로로.

> 이 문서는 **계획의 정본**이다. "지금 어디까지 왔나"는 `05-PROGRESS.md`에서 관리한다.
> 아래 체크박스는 마일스톤 단위의 개요이고, 세부 진행표는 05에 있다.

## M0 — 리포 부트스트랩 (첫 세션, 1~2시간)
- [x] git 초기화 + public 원격 리포 (`github.com/jwj-nick/ariadne`)
- [x] 이 문서들 읽고 OPEN QUESTIONS(01-DESIGN-LOG 하단) 오너에게 확인 — Q1·Q5 해결
- [x] `scripts/validate.ts`, `scripts/build.ts` (md → graph.json)
- [ ] 시드 카드 20장 수작업 (아래 목록) — 스키마 검증용. `status: reviewed` (D15)
- [ ] Next.js 앱 골격 + graph.json 로드 + 조회 화면(검색만)
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
- [ ] SM-2 스케줄러 (`app/lib/learning/`, 과목 독립)
- [ ] 퀴즈 화면: 추측 → 힌트(AI, 3단) → 답 → 카드. 타입 `trace_to_source`, `idiom_origin` 먼저
- [ ] 저장 계층 `app/lib/store/` 인터페이스 + localStorage 구현 (D14)
- [ ] Supabase Auth(가족 계정) + review_state — **M1 후반**, 저장 계층의 두 번째 구현으로
- [ ] kid/adult 토글

## M2 — 조우 캡처 (1주)
- [ ] PWA manifest + Web Share Target (텍스트/URL 먼저, 이미지 다음)
- [ ] `capture-match` AI 엔드포인트 → 매칭 or candidate 생성
- [ ] "오늘의 조우" 화면 + 캡처가 당일 퀴즈 데크에 편입
- [ ] Vercel 배포, 오너 폰에 설치

## M3 — 콘텐츠 스케일 (병렬, 2~3주)
- [ ] trace-harvester로 소스별 후보 추출.
      **순서 = 브랜드 50 → 관용구 50 → 천문·코드명 40 → 심리·의학 30 → 영화·문학 20 → 회화 10** (Q4 추천안, 오너 확인 대기).
      근거: 큐레이션 기준이 "마주칠 확률"인데 `frequency: 5`는 브랜드와 관용구에 몰려 있다.
      천문 명명표는 정형화되어 있어서 파이프라인 회귀 테스트용 두 번째 배치로 적합하다.
- [ ] card-author로 완성, link-auditor 통과
- [ ] 웹 승인 UI (candidate → published)
- [ ] 목표: trace 200 / source 120 / 고아 0

## M4 — 가족·공개 (그 이후)
- [ ] 아이 계정 온보딩, kid 퀴즈만 노출하는 모드
- [ ] 그래프 뷰 (source 중심 방사형)
- [ ] `explain_allusion`, `image_to_source`, `parallel` 퀴즈
- [ ] 초대제 공개 → 피드백 → 일반 공개 판단

## 측정 (M1부터 로그)
- 주간 캡처 수, 퀴즈 정답률(타입별), 힌트 사용 횟수, 3개월 후 "즉답 가능" 흔적 수.
