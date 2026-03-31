# 2026-03-31 kordoc 레포지토리 분석

## 지시 요약
- `https://github.com/chrisryugj/kordoc.git` 레포지토리를 클론하여 프로젝트 목적, 구조, 기술스택, MCP 도구, 사용법 등을 종합 분석

## 분석 결과

### 1. 프로젝트 개요
**kordoc** (v1.6.1) — 한국 공문서(HWP 5.x, HWPX, PDF)를 마크다운으로 변환하는 파서 라이브러리.
- 슬로건: "모두 파싱해버리겠다 — The Korean Document Platform"
- 작성자: chrisryugj (한국 공무원 출신, 7년간 HWP 파일 처리 경험)
- 라이선스: MIT
- 5개 실제 정부 프로젝트에서 실전 검증 완료

### 2. 핵심 기능
| 기능 | 설명 |
|------|------|
| 문서 파싱 | HWP, HWPX, PDF → Markdown + IRBlock[] 구조화 데이터 |
| 문서 비교 | 두 문서의 IR 레벨 diff (크로스 포맷 HWP↔HWPX 지원) |
| 양식 인식 | 정부 서식에서 레이블-값 쌍 자동 추출 |
| HWPX 생성 | Markdown → HWPX 역변환 |
| 테이블 감지 | 선 기반 + 클러스터 기반 테이블 감지 (선 없는 PDF 포함) |
| OCR 통합 | 이미지 기반 PDF용 플러거블 OCR 프로바이더 |
| Watch 모드 | 디렉토리 감시 + 자동 변환 + 웹훅 알림 |

### 3. 프로젝트 구조
```
kordoc/
├── src/
│   ├── index.ts          # 메인 API (parse, parseHwpx, parseHwp, parsePdf)
│   ├── types.ts          # IR 타입 (IRBlock, IRTable, ParseResult 등)
│   ├── detect.ts         # 매직바이트 기반 포맷 감지
│   ├── cli.ts            # Commander 기반 CLI
│   ├── mcp.ts            # MCP 서버 (7개 도구)
│   ├── utils.ts          # 공용 유틸 (에러 분류, 경로 보안)
│   ├── watch.ts          # 디렉토리 감시 모드
│   ├── page-range.ts     # 페이지 범위 파서
│   ├── hwpx/
│   │   ├── parser.ts     # HWPX (ZIP+XML) 파서 (722줄)
│   │   └── generator.ts  # Markdown → HWPX 생성기
│   ├── hwp5/
│   │   ├── parser.ts     # HWP 5.x (OLE2) 바이너리 파서 (473줄)
│   │   └── record.ts     # 레코드 리더, UTF-16LE, zlib 해제
│   ├── pdf/
│   │   ├── parser.ts     # PDF 텍스트 추출 (1,145줄 — 가장 큰 파일)
│   │   ├── line-detector.ts   # 선 기반 테이블 감지
│   │   ├── cluster-detector.ts # 클러스터 기반 테이블 감지
│   │   └── polyfill.ts
│   ├── diff/
│   │   ├── compare.ts    # 문서 비교 로직
│   │   └── text-diff.ts  # 텍스트 diff 유틸
│   ├── form/
│   │   └── recognize.ts  # 양식 필드 인식
│   ├── table/
│   │   └── builder.ts    # 2-pass 그리드 테이블 빌더
│   └── ocr/
│       └── provider.ts   # OCR 프로바이더 인터페이스
├── tests/                # 19개 테스트 파일
├── demo/                 # 데모 앱
├── .github/workflows/    # CI
├── tsup.config.ts        # 듀얼 빌드 (ESM+CJS 라이브러리 + ESM 바이너리)
└── package.json
```

총 소스 코드: ~3,247줄 (중복 집계 제외 시)

### 4. 기술 스택
| 항목 | 기술 |
|------|------|
| 언어 | TypeScript (ESM + CJS 듀얼 빌드) |
| 빌드 | tsup (두 파이프라인: 라이브러리 + 바이너리) |
| 런타임 | Node.js >= 18 |
| 테스트 | Node.js 내장 test runner (`node --test`) |
| CLI | commander |
| MCP | @modelcontextprotocol/sdk (v1.28.0+) |
| HWP5 파싱 | cfb (OLE2/CFB 파서, 번들에 포함) |
| HWPX 파싱 | jszip + @xmldom/xmldom |
| PDF 파싱 | pdfjs-dist (선택적 peer dependency) |
| 스키마 | zod (MCP 도구 입력 검증) |

### 5. MCP 서버 도구 (7개)
| 도구명 | 설명 |
|--------|------|
| `parse_document` | HWP/HWPX/PDF 파일을 마크다운으로 변환. 메타데이터, 문서 구조(outline), 경고 포함 |
| `detect_format` | 매직 바이트로 파일 포맷 감지 (hwpx, hwp, pdf, unknown). 첫 16바이트만 읽음 |
| `parse_metadata` | 메타데이터만 빠르게 추출 (전체 파싱 없이 헤더/매니페스트만) |
| `parse_pages` | 특정 페이지/섹션 범위만 파싱 (예: "1-3", "1,3,5-7") |
| `parse_table` | 문서에서 N번째 테이블만 추출 (0-based index) |
| `compare_documents` | 두 문서 비교 (추가/삭제/변경 블록). 크로스 포맷(HWP↔HWPX) 지원 |
| `parse_form` | 서식 문서에서 레이블-값 쌍을 구조화된 JSON으로 추출 |

MCP 실행: `npx kordoc-mcp` (stdio 전송)

### 6. 사용 방식 (3가지 인터페이스)
1. **라이브러리 API**: `import { parse } from "kordoc"` — Node.js 프로젝트에 임베드
2. **CLI**: `npx kordoc document.hwpx` — 명령줄 변환 (배치, watch 모드 포함)
3. **MCP 서버**: `npx kordoc-mcp` — Claude/Cursor/Windsurf에서 도구로 연동

### 7. 설정/설치 요건
- `npm install kordoc` (기본)
- `npm install pdfjs-dist` (PDF 지원 시 선택 설치)
- 특별한 설정 파일 불필요 — zero-config 설계

### 8. 보안 하드닝
- ZIP bomb 방지 (엔트리 수/비압축 크기 제한)
- XXE/Billion Laughs 방지
- 경로 순회 차단 (isPathTraversal)
- MCP 에러 정제 (sanitizeError — 내부 경로/스택 노출 방지)
- 파일 크기 제한 (500MB)

### 9. 아키텍처 패턴
**IR 패턴** (현실 비유: 통역사)
- 각 파서(HWP, HWPX, PDF)가 직접 마크다운을 생성하지 않음
- 먼저 IRBlock[] (중간 표현)으로 "번역"한 후, blocksToMarkdown()에서 일괄 마크다운 변환
- 마치 UN 회의에서 각국 대표가 영어/프랑스어/중국어로 말하면, 통역사가 하나의 공통 언어로 정리한 뒤 최종 문서를 작성하는 것과 동일

## 결과
- `/tmp/kordoc-analysis`에 클론 완료
- 한국 공문서 파싱 특화 라이브러리로, leeloo-util의 lk-iu-pdf-extract와 기능적으로 겹치는 영역 있음
- MCP 서버로도 동작하므로 Claude Code 플러그인/도구로 즉시 연동 가능
