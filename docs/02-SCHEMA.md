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
domain: greco-roman-myth   # 확정 4종: greco-roman-myth | bible-ot | bible-nt | history  ("도메인 목록" 절 참조)
name_ko: 니케
name_en: Nike (Νίκη)
aliases: [Victoria, 빅토리아]   # 로마식 이름, 이형 표기. 별도 노드로 나누지 않는다
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

## 도메인 목록 (확정 — D12, D13)

초기 도메인은 아래 4종이다. 나머지(`shakespeare`, `renaissance-art`, `philosophy`, `literature` 등)는
**해당 도메인의 첫 source 카드가 실제로 생기는 시점에** 폴더와 함께 추가한다.
비어 있는 도메인을 미리 선언하면 카드가 흩어져서 고아 경고(W01)만 늘어나기 때문이다.

| domain | 폴더 | 범위 |
|---|---|---|
| `greco-roman-myth` | `content/sources/greco-roman-myth/` | 그리스 신화 + 로마 신화 **통합**. 로마 고유 신(Janus, Vesta 등)도 여기. |
| `bible-ot` | `content/sources/bible-ot/` | 구약 (창세기~말라기). 노아, 바벨탑, 다윗과 골리앗, 삼손 등. |
| `bible-nt` | `content/sources/bible-nt/` | 신약. 돌아온 탕자, 선한 사마리아인, 유다의 입맞춤, 최후의 만찬 등. |
| `history` | `content/sources/history/` | 그리스로마사 + 서양사 통합. 트로이 전쟁, 카이사르, 델포이 신탁, 프랑스혁명 등. |

### 그리스·로마 통합 규칙 (중요)
제우스와 유피테르, 니케와 빅토리아처럼 **같은 존재의 그리스명·로마명은 하나의 source 노드**로 둔다.
- 파일명(slug)과 `name_ko`/`name_en`은 **더 널리 통용되는 쪽**을 쓴다. 보통 그리스명이지만,
  목성(Jupiter)·수성(Mercury)처럼 로마명 흔적이 압도적이면 로마명을 대표로 삼아도 된다.
- 다른 쪽 이름은 `aliases`에 반드시 넣는다. 검색과 중복 감사(W04)가 이 필드를 본다.
- 로마 고유 신처럼 그리스 대응이 없는 경우에는 `aliases`를 비워 둔다.

근거: 별도 노드로 나누면 흔적을 어느 쪽에 연결할지 매번 판단해야 하고, 같은 인물의 카드가
두 벌로 갈라져 링크 감사가 계속 걸린다.

### 성경 구약·신약 분리 규칙
구약과 신약은 별도 도메인으로 유지한다. 두 문헌은 서양 미술·문학에서 인용되는 맥락이 서로 달라서,
나중에 "구약 유래 흔적만 모아 보기" 같은 조회가 실제로 쓸모가 있다고 보았기 때문이다.

## 링크 규칙
- trace → source 는 frontmatter `sources`로만. 본문 `[[source:xxx]]`도 허용하되 빌드 시 frontmatter와 대조.
- source → trace 역링크는 **빌드가 생성**. 손으로 쓰면 link-auditor가 제거 요청.
- source ↔ source 는 `relations`의 정해진 rel 어휘만: `child_of, parent_of, sibling_of, spouse_of, lover_of, enemy_of, companion_of, kills, killed_by, transforms_into, appears_in, precedes, follows, parallel_of`(신화↔성경 대응 등).
- 고아 source(들어오는 trace 0개)는 `published` 불가 → 경고. 단, 다른 source가 relations로 3개 이상 참조하면 허브로 인정.

## status 생애주기 (D15)

`candidate` → `reviewed` → `published` → (`retired`)

| status | 누가 부여하나 | 앱 노출 |
|---|---|---|
| `candidate` | harvester, 캡처 매칭 실패 | 노출하지 않음 |
| `reviewed` | card-author 스킬 (스키마 통과 + 사실 확인 완료) | **M3 이전에는 노출.** 승인 UI가 없는 동안의 잠정 조치 |
| `published` | **오너만, 웹 승인 UI에서** (D9) | 노출 |
| `retired` | 오너 | 노출하지 않음. 파일은 남긴다 |

M3에서 웹 승인 UI가 완성되면 `reviewed` 카드를 일괄 승격하고,
그 시점부터 앱은 `published`만 읽도록 조건을 좁힌다.
Claude Code가 `published`를 직접 쓰는 일은 어느 단계에서도 없다.

## 사용자 상태 (D14 — M1 전반은 localStorage, 후반에 Supabase)
- `review_state(user_id, trace_id, ease, interval, due, reps, lapses)` — SM-2
- `capture(id, user_id, raw_text, raw_url, image_path, matched_trace_id, candidate_id, created_at)`
- `quiz_log(user_id, trace_id, quiz_type, guess, correct, hint_count, at)`
- `candidate(id, payload_md, proposed_by, status, reviewed_by, reviewed_at)`

M0와 M1 전반에서는 위 네 가지를 **브라우저 `localStorage`에 같은 형태로** 저장한다.
Supabase는 두 번째 기기가 붙거나 승인 UI가 필요해지는 M1 후반에 도입한다.
그때 마이그레이션이 단순해지도록, 저장 계층은 처음부터 `app/lib/store/` 뒤에 인터페이스로 감춘다.
`localStorage` 구현과 Supabase 구현이 같은 인터페이스를 만족하게 한다.

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
