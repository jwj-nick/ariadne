---
name: link-auditor
description: content/ 전체를 스캔해 스키마 위반, 깨진 링크, 고아 source(들어오는 trace 0개), 중복 slug, 손으로 쓴 역링크, 빈 why, published 상태 오남용을 찾아 리포트한다. 빌드 전, 콘텐츠 배치 완료 후, /audit 커맨드에서 사용.
---

# link-auditor

## 검사 항목
| 코드 | 내용 | 심각도 |
|---|---|---|
| E01 | frontmatter 필수 필드 누락 (`id, type, name_ko, name_en, status`) | error |
| E02 | trace의 `sources` 빈 배열 또는 존재하지 않는 id | error |
| E03 | trace `why` 비어 있음 / TODO | error (publish 차단) |
| E04 | `level_kid` 또는 `level_adult` 누락 | error |
| E05 | 손으로 쓴 `traces:` 역링크 (source) | error — 삭제 요청 |
| E06 | `id` 의 접두사나 slug 가 파일 경로와 불일치 | error |
| E07 | 중복 `id` | error |
| E08 | `category` / `domain` 이 허용 목록 밖이거나 폴더 이름과 불일치 | error |
| E09 | `status` 가 허용 어휘 밖 | error |
| W01 | 고아 source (in-degree 0, relations 참조 <3) | warn |
| W02 | 본문 5섹션 순서 위반 | warn |
| W03 | `relations.rel`이 허용 어휘 밖 | warn |
| W04 | 중복 의심 (name_en 유사도 > 0.9) | warn |
| W05 | 저작권 의심 장문 인용 (연속 15단어 이상 인용부호) | warn |
| W06 | `frequency` 누락 또는 1~5 범위 밖 | warn |

## 구현

이 검사는 **`scripts/lib/checks.ts` 에 코드로 구현되어 있다.** 스킬이 직접 파일을 훑지 말고 아래를 실행한다.

```
npm run audit          # 감사 + reports/audit-<날짜>.md
npm test               # 검사기 자체의 회귀 테스트 (tests/checks.test.ts)
```

검사 규칙을 바꿀 때는 세 곳을 함께 고친다: 이 표, `scripts/lib/checks.ts`, `tests/checks.test.ts`.

## 출력
- 콘솔 표 + `reports/audit-<date>.md`
- error가 1개라도 있으면 `scripts/build`는 실패해야 한다.
- 자동 수정 가능한 것(E05, W02)은 diff를 제안만 하고 적용하지 않는다.
