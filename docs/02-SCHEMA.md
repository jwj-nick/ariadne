# 02. SCHEMA — trace / source 노드

## 두 종류의 노드

### trace (흔적) — 현대 생활에서 마주치는 것
`content/traces/<category>/<slug>.md`

```yaml
---
id: trace:nike
type: trace
category: brand            # brand | science-astro | psych-med | art | lit-film | politics-law | idiom | codename | place | other
name_ko: 나이키
name_en: Nike
sources: [source:nike-goddess]      # 최소 1개
why: 승리의 여신 니케에서 이름을 땄다. 로고 "스우시"는 니케의 날개를 형상화한 것으로 알려져 있다.
frequency: 5               # 1~5, 실제 삶에서 마주칠 확률
domain_hint: [sports, logo]
status: published          # candidate | reviewed | published | retired
captured_by: seed          # seed | harvester | capture:<user_id>
created: 2026-09-06
---
```

본문 (순서 고정):
1. **한 줄** — 아이도 이해하는 정의
2. **어디서 만나나** — 실제 접점 2~3개 (로고, 광고 문구, 뉴스 표현)
3. **왜 이 이름인가** — frontmatter `why`의 확장 (2~4문장)
4. **같은 원천의 다른 흔적** — 자동 생성 가능 (link-auditor가 채움)

### source (원천) — 신·인물·사건·개념·작품
`content/sources/<domain>/<slug>.md`

```yaml
---
id: source:nike-goddess
type: source
domain: greek-myth         # greek-myth | roman-myth | bible-ot | bible-nt | greco-roman-history | shakespeare | renaissance-art | western-history | philosophy
name_ko: 니케
name_en: Nike (Νίκη)
aliases: [Victoria]        # 로마식 이름 등
relations:
  - {rel: child_of, target: source:styx}
  - {rel: companion_of, target: source:athena}
level_kid: 승리를 상징하는 날개 달린 여신.
level_adult: 그리스 신화의 승리의 여신. 로마의 빅토리아에 해당. 아테나의 동반자로 자주 묘사되며, 루브르의 <사모트라케의 니케> 조각으로 유명하다.
korea_parallel: ""         # 선택. 예: 오르페우스 ↔ 바리데기
traces: []                 # 빌드 시 역링크 자동 채움 — 손으로 쓰지 않는다
status: published
created: 2026-09-06
---
```

본문 (순서 고정):
1. **한 줄 정의**
2. **3문장 스토리** — 핵심 사건만
3. **왜 알아야 하나** — 파생 관용구·영어 표현·유명 그림·영화·브랜드 (trace 링크로)
4. **연결** — 가족·적·연인·관련 사건 (relations의 서술형)
5. **한국 대응물** (선택)

## 링크 규칙
- trace → source 는 frontmatter `sources`로만. 본문 `[[source:xxx]]`도 허용하되 빌드 시 frontmatter와 대조.
- source → trace 역링크는 **빌드가 생성**. 손으로 쓰면 link-auditor가 제거 요청.
- source ↔ source 는 `relations`의 정해진 rel 어휘만: `child_of, parent_of, sibling_of, spouse_of, lover_of, enemy_of, companion_of, kills, killed_by, transforms_into, appears_in, precedes, follows, parallel_of`(신화↔성경 대응 등).
- 고아 source(들어오는 trace 0개)는 `published` 불가 → 경고. 단, 다른 source가 relations로 3개 이상 참조하면 허브로 인정.

## 사용자 상태 (Supabase, 콘텐츠와 분리)
- `review_state(user_id, trace_id, ease, interval, due, reps, lapses)` — SM-2
- `capture(id, user_id, raw_text, raw_url, image_path, matched_trace_id, candidate_id, created_at)`
- `quiz_log(user_id, trace_id, quiz_type, guess, correct, hint_count, at)`
- `candidate(id, payload_md, proposed_by, status, reviewed_by, reviewed_at)`

## 퀴즈 타입 (quiz_type)
- `trace_to_source` — 이 이름/로고/용어의 원천은?
- `idiom_origin` — 이 관용구는 어디서 왔나?
- `image_to_source` — 이 그림·장면은 무엇을 그린 것?
- `fill_relation` — 가계도·관계 빈칸
- `explain_allusion` — 이 뉴스/문장의 비유를 설명하라 (자유답, AI 채점)
- `parallel` — 신화↔성경↔한국 대응 짝짓기

모든 타입 공통: **추측 입력 → 힌트(최대 3단) → 정답 → 카드**. 힌트는 원천 이름을 직접 말하지 않는다.

## 빌드 산출물
`app/data/graph.json` = `{ traces: [...], sources: [...], edges: [...] }`, 검색 인덱스 포함. 앱은 이 파일만 읽는다.
