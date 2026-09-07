---
name: trace-harvester
description: 명명표·용어집·브랜드 리스트·관용구 사전 등 텍스트/CSV/URL 입력에서 서양 문화 원천(신화·성경·역사·문학)에서 유래한 "흔적(trace)" 후보를 대량 추출해 content/candidates/에 trace+source 쌍으로 저장한다. 초기 큐레이션, 새 도메인 추가, 캡처로 들어온 미매칭 항목 일괄 처리 시 사용.
---

# trace-harvester

## 언제
- 새 데이터 소스(예: IAU 위성 목록, 심리학 용어집)를 넣어 후보를 뽑을 때
- `content/candidates/`가 비어 있고 콘텐츠 스케일이 필요할 때

## 절차
1. 입력을 항목 단위로 정규화 (이름, 설명 1줄, 출처 URL).
2. 각 항목에 대해 판단: 서양 문화 원천 유래인가? (그리스로마신화 / 성경 / 그리스로마사 / 셰익스피어 / 르네상스 회화 / 서양사 / 철학)
   - 확신 없으면 `confidence: low`로 표기하고 버리지 않는다.
   - 단순 라틴어·그리스어 어원(예: "television")은 제외 — **이야기·인물·사건이 있는 것만**.
3. `docs/02-SCHEMA.md`의 frontmatter로 trace 파일 작성. 이미 `content/sources/`에 원천이 있으면 링크만, 없으면 source 파일도 candidate로 함께 생성.
4. `frequency` 1~5 추정 기준: 5=일상 브랜드·행성·기본 관용구, 3=교양 있는 성인이 가끔 만남, 1=전문 분야.
5. 결과 요약 표 출력: 항목 수 / 신규 source 수 / low confidence 수 / 상위 frequency 10개.

## 하지 말 것
- `status: published`로 쓰지 않는다. 항상 `candidate`.
- `why`를 비워두지 않는다. 모르면 `why: "TODO — 어원 근거 확인 필요"`와 `confidence: low`.
- 저작권 텍스트를 붙여넣지 않는다.
