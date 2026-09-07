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
| W01 | 고아 source (in-degree 0, relations 참조 <3) | warn |
| W02 | 본문 5섹션 순서 위반 | warn |
| W03 | `relations.rel`이 허용 어휘 밖 | warn |
| W04 | 중복 의심 (name_en 유사도 > 0.9) | warn |
| W05 | 저작권 의심 장문 인용 (연속 15단어 이상 인용부호) | warn |

## 출력
- 콘솔 표 + `reports/audit-<date>.md`
- error가 1개라도 있으면 `scripts/build`는 실패해야 한다.
- 자동 수정 가능한 것(E05, W02)은 diff를 제안만 하고 적용하지 않는다.
