# 04. ROADMAP — v1

목표: **오너가 폰에서 캡처하고, 저녁에 퀴즈 풀고, 아이가 kid 퀴즈를 혼자 푸는 상태**를 최단 경로로.

## M0 — 리포 부트스트랩 (첫 세션, 1~2시간)
- [ ] 이 문서들 읽고 OPEN QUESTIONS(01-DESIGN-LOG 하단) 오너에게 확인
- [ ] `scripts/validate.ts`, `scripts/build.ts` (md → graph.json)
- [ ] 시드 카드 20장 수작업 (아래 목록) — 스키마 검증용
- [ ] Next.js 앱 골격 + graph.json 로드 + 조회 화면(검색만)

**시드 20 (trace → source):**
Nike→니케 / Amazon→아마존족 / Pandora(앱·상자)→판도라 / Apollo 계획→아폴론 / Artemis 계획→아르테미스 /
Trojan(바이러스)→트로이 목마 / Titan(로켓·위성)→티탄 / Atlas(지도책·로켓)→아틀라스 / 목성 Jupiter→유피테르·제우스 /
Europa(위성)→에우로페 / narcissism→나르키소스 / mentor→멘토르 / nemesis→네메시스 / Achilles heel→아킬레우스 /
Se7en(영화)→7대 죄악 / prodigal son→돌아온 탕자 / Judas kiss→유다 / Good Samaritan→선한 사마리아인 /
Ariadne's thread→아리아드네 / Oracle(회사)→델포이 신탁

## M1 — 학습 루프 (1~2주)
- [ ] SM-2 스케줄러 (`app/lib/learning/`, 과목 독립)
- [ ] 퀴즈 화면: 추측 → 힌트(AI, 3단) → 답 → 카드. 타입 `trace_to_source`, `idiom_origin` 먼저
- [ ] Supabase Auth(가족 계정) + review_state
- [ ] kid/adult 토글

## M2 — 조우 캡처 (1주)
- [ ] PWA manifest + Web Share Target (텍스트/URL 먼저, 이미지 다음)
- [ ] `capture-match` AI 엔드포인트 → 매칭 or candidate 생성
- [ ] "오늘의 조우" 화면 + 캡처가 당일 퀴즈 데크에 편입
- [ ] Vercel 배포, 오너 폰에 설치

## M3 — 콘텐츠 스케일 (병렬, 2~3주)
- [ ] trace-harvester로 소스별 후보 추출 (천문 → 브랜드 → 심리·의학 → 관용구 → 회화 → 영화 순)
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
