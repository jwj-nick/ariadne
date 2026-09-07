---
name: quiz-generator
description: published 카드에서 6가지 quiz_type(trace_to_source, idiom_origin, image_to_source, fill_relation, explain_allusion, parallel) 퀴즈 아이템과 3단 힌트를 생성한다. 힌트는 원천 이름을 직접 노출하지 않으며, 추측→힌트→답→카드 순서를 강제한다. 퀴즈 데이터 생성·검수 시 사용.
---

# quiz-generator

## 핵심 규칙 (위반 시 아이템 폐기)
- 힌트 1~3 어디에도 정답(원천 이름, 별칭, 로마식 이름) 문자열이 들어가지 않는다. 자동 검사.
- 힌트 순서: 1=맥락(어느 분야 이야기인가) → 2=속성(무엇을 상징/무슨 일을 했나) → 3=거의 답(첫 글자 또는 관련 인물).
- 문제는 **흔적에서 출발**한다. "제우스의 아버지는?" 같은 원천→원천 문제는 `fill_relation`에서만 허용.
- kid 버전은 문장 짧게, 선택지 3개. adult는 자유 입력 우선.

## 출력
`app/data/quiz/<trace-slug>.json`
```json
{ "trace_id": "trace:nike", "items": [
  { "type": "trace_to_source", "level": "adult",
    "prompt": "스포츠 브랜드 Nike의 이름은 어디서 왔을까?",
    "hints": ["그리스 신화 속 존재입니다.", "날개가 달렸고, 승리를 상징합니다.", "루브르에 이 존재의 유명한 조각상이 있습니다."],
    "answer": "니케 (Nike), 그리스 신화의 승리의 여신",
    "accept": ["니케", "nike", "승리의 여신"] } ] }
```

## 절차
1. 카드 읽기 → 적용 가능한 type 판단 (이미지 없으면 image_to_source 생략).
2. 아이템 작성 → 정답 누출 자동 검사 → `accept` 동의어 3개 이상.
3. `explain_allusion`은 실제 뉴스/문학 문장 스타일로 오리지널 예문을 **직접 작성** (실제 기사 인용 금지).
