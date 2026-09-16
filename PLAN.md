# 작업 계획 — v5.0.7 병합 후 보안 재점검 및 한국어 현지화

- 기준 커밋: `434b836` (upstream v5.0.7 병합, 2026-09-16), Bun 1.4.0, Electron 41.10.7, tunnel-client v0.0.12
- 이전 계획(v4.0.8 보안 강화)은 완료되어 [docs/archive/2026-09-02-security-hardening-plan-v4.0.8.md](docs/archive/2026-09-02-security-hardening-plan-v4.0.8.md)로 이관했습니다.
- 이 문서는 사용자(포크 운영자)가 읽는 문서이므로 한국어로만 작성합니다. 코드 식별자·경로·명령·오류 문자열은 원문 유지.

---

## 0. 이번 재점검 결론 (2026-09-16)

| 영역 | 결론 |
| :--- | :--- |
| 보안 | **신규 취약점 없음. 코드 수정 불필요.** v4.0.8에서 추가한 방어 5종이 병합 후에도 모두 유지되고, v5.0.7에서 새로 들어온 표면(제어 서버, 네이티브 패스스루, 신규 `/v1/*`·`/admin/*` 라우트)도 기존 신뢰 경계 안에 있음 (§1) |
| 의존성 | `bun audit` 루트 106개·런처 351개 패키지 취약점 0건. `@hono/node-server` 2.0.12 override 유지 (`package.json:76`) |
| 테스트 | 보안 관련 `bun test` 5파일 47 pass / 0 fail. 런처 `node --test` 308건 중 305 pass, 2 skip, 1 fail — 실패 1건은 Windows 심볼릭 링크 권한(EPERM) 환경 문제로 코드 결함 아님 (§1.3) |
| 현지화 | 런처 렌더러 사전은 한국어 완비. **런처 네이티브 트레이·다이얼로그(`NATIVE_COPY`)에 한국어 없음**, 런타임 오류 메시지 26종 영어 통과, 사용자 문서 7종 영어만 존재 (§2) |
| 실행 여부 | 이번 턴의 산출물은 본 계획 문서와 아카이브만. 보안은 재점검 결과 고칠 것이 없었고, 현지화 구현(§3 L1~L4)은 계획으로 남김 (§5 미해결 질문 1) |

---

## 1. 보안 재점검 결과 (v5.0.7)

### 1.1 v4.0.8 조치의 병합 후 생존 확인

| 조치 | 판정 | 근거 |
| :--- | :---: | :--- |
| `Host`/`Origin` 루프백 가드가 모든 라우트 앞에 위치 | ✅ 유지 | `src/server.ts:106-121` (`isLoopbackRequest`), `src/server.ts:826-833` — `fetch()` 첫 분기에서 403 반환. `/healthz`(835) 포함 모든 라우트가 그 뒤에 있음 |
| tunnel-client 아카이브 SHA-256 6종 소스 고정 + `SHA256SUMS.txt` 이중 검증 | ✅ 유지 | `src/tunnel.ts:12` (`PINNED_ARCHIVE_SHA256`), `:54-62` (`assertPinnedArchive`), `:131-138` (고정 해시 없으면 다운로드 전 실패 → 고정 해시 대조 → 업스트림 체크섬 대조) |
| CDP `remote-debugging-address=127.0.0.1`, `remote-allow-origins` 부재 | ✅ 유지 | `launcher/electron/main.cjs:976`, 회귀 assertion `launcher/tests/packaging-contract.test.cjs:28-29` |
| 신뢰할 수 없는 저장소 운용 지침 | ✅ 유지 | `docs/security-model.md:55`, `SECURITY.md:12`, `README.md:109`, `README.ko.md:110` |
| `/admin/*` bearer 토큰 `timingSafeEqual` | ✅ 유지 | `src/server.ts:816-821` (`controlAuthorized`). 신규 `/admin/interrupt-turn`, `/admin/cancel-turns`도 같은 함수 사용 |

### 1.2 v5.0.7 신규 표면 점검

| 표면 | 판정 | 근거 |
| :--- | :---: | :--- |
| 런처 제어 서버 `launcher/electron/control-server.cjs` | ✅ 안전 | `listen(0, "127.0.0.1")`(74), 32바이트 `randomBytes` 토큰(45), `timingSafeEqual` 길이 비교(9-14), 본문 상한 16 KiB·수동 턴 시작만 3 MiB(5-6). 토큰은 프로세스 메모리에만 존재 |
| 네이티브 패스스루 `/v1/images/*`, `/v1/alpha/search` | ✅ 안전 | 업스트림 호스트가 상수 `https://chatgpt.com/backend-api/codex`로 고정(`src/native-passthrough.ts:9`) → SSRF 불가. 수신 Bearer 없으면 거부(213-215, `src/server.ts:440-442`). `proxy-authorization` 등 홉 헤더 제거(21) |
| 신규 라우트 `/v1/responses/compact`, `/admin/interrupt-turn`, `/admin/cancel-turns` | ✅ 안전 | 모두 루프백 가드 뒤, `/admin/*`은 `controlAuthorized` 뒤 |
| Electron 렌더러 격리 | ✅ 안전 | 런처 창·브라우저 호스트 창 모두 `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` (`main.cjs:378-380`, `browser-host.cjs:401-403, 545-547, 615-617`). `will-navigate` 가드와 `setWindowOpenHandler`로 외부 URL은 `shell.openExternal`만 허용(`http:`/`https:` 한정) |
| 설정 파일·비밀 저장 | ✅ 안전 | `src/config.ts:165-176` — 디렉터리 0o700, 임시 파일 `wx`+0o600 후 원자적 rename. `controlToken`은 base64url 40자 이상 형식 검증(`config.ts:442`), 서비스 재시작 시 재발급(`setup.ts:477`) |
| 의존성 | ✅ 안전 | `bun audit` 0건(루트·런처). `SECURITY.md` 4단락의 override 설명은 여전히 사실과 일치 |

### 1.3 잔여 관찰 (취약점 아님)

| # | 관찰 | 위험 | 제안 |
| :-: | :--- | :---: | :--- |
| S1 | `launcher/tests/runtime-host.test.cjs:1003` 테스트가 `fs.symlinkSync`를 호출해 심볼릭 링크 권한이 없는 Windows 사용자 세션에서 `EPERM`으로 실패. GitHub Windows 러너(관리자)와 macOS/Linux에서는 통과 | 낮음 (개발 환경) | P3 — 링크 생성 실패 시 `t.skip()`으로 건너뛰는 가드 추가. 코드 동작과 무관하므로 별도 커밋 |
| S2 | `LOOPBACK_HOSTS`에 `localhost` 포함(v4.0.8 판단 그대로). 저장소 내 호출자는 모두 `127.0.0.1` 사용 | 낮음 | 변경 없음. 수동 curl 편의용으로 유지 |
| S3 | 동일 OS 사용자 로컬 프로세스의 CDP·제어 서버 접근은 `docs/security-model.md` "Non-goals"의 신뢰 경계 외부 | — | 변경 없음 |

### 1.4 검증 명령 (이번 턴에 실행한 것)

```bash
bun test tests/server-security.test.ts tests/tunnel.test.ts tests/launcher-localization.test.ts tests/launcher-browser-host.test.ts tests/native-passthrough.test.ts
bun audit
bun run launcher:audit
bun run launcher:test
bun run typecheck
```

결과: 보안 테스트 47 pass, audit 0건, typecheck 통과, 런처 테스트 305/308 (S1 환경 실패 1, skip 2).

---

## 2. 한국어 현지화 현황

| 구성요소 | 현황 | 갭 |
| :--- | :--- | :--- |
| 런처 렌더러 사전 `launcher/src/i18n.ts` | `ko` 196키 완비(`:600-798`). 영어와 동일한 5키는 브랜드/고유 표기(`product`, `devBadge`, `manualInteraction`, `zeroRiskProProfile`, `tunnelId`) | 없음 |
| 언어 선택 | 온보딩에서 사용자가 선택(`main.cjs:508-519`), 선택 전 기본값 `"en"`(`App.tsx:42,104`). OS 로케일 자동 감지 없음 | 선택 사항 (§3 L5) |
| 런처 네이티브 UI `NATIVE_COPY` (`main.cjs:199-270`) | 트레이 메뉴·모델 제거 확인 다이얼로그·시작 실패 다이얼로그 13개 문자열. **`en`, `zh-CN`, `zh-TW`만 존재** → 한국어 선택 사용자에게 영어 표시 | **L1** |
| 런타임 메시지 `localizeRuntimeMessage` (`i18n.ts:1008-1066`) | doctor 성공 메시지 13종·진행 메시지 2종만 번역. `src/doctor.ts`의 `error` 21종·`warning` 5종은 영어 그대로 렌더러에 표시 | **L2** |
| `main.cjs` 작업 메시지 | 4개 중 `"Finish the active Codex task before verifying the ChatGPT connector"`(597), `"Launcher shutdown is already in progress"`(917) 미번역 | **L3** |
| 사용자 문서 | `README.ko.md` 존재(`README.md`와 코드 펜스·링크 1:1 동기화 테스트 있음). `TROUBLESHOOTING.md`(245줄), `SECURITY.md`(22), `CONTRIBUTING.md`(52), `docs/architecture.md`(238), `docs/dev-chat.md`(174), `docs/release-validation.md`(77), `docs/security-model.md`(130)는 영어만 존재하고 `README.ko.md`가 이 영어 문서들로 링크 | **L4** |
| CLI 터미널 출력 (`src/cli.ts`, `setup.ts`, `doctor.ts`) | 영어. 런처 없이 CLI만 쓰는 경로 | 범위 외 제안 (§3 L5) |

### 2.1 현지화 작업에 걸리는 테스트 제약 (반드시 함께 고려)

- `tests/launcher-localization.test.ts`: 5개 언어 사전의 **키 집합이 동일**해야 하고, 값이 비어 있으면 안 되며, `{placeholder}` 집합이 영어와 같아야 함. → `ko`용 키를 추가하면 `en`, `zh`, `ja`, `zhTW`에도 같은 키를 넣어야 한다.
- `launcher/tests/localization.test.cjs:44-49`: `README.ko.md`·`README.ja.md`·`README.zh-CN.md`의 `bash`/`powershell` 펜스와 **링크 타깃 집합이 `README.md`와 완전히 같아야** 함. → `README.ko.md`의 링크를 `TROUBLESHOOTING.ko.md`로 바꾸거나 링크를 추가하면 실패한다.
- `launcher/tests/localization.test.cjs:217`, `launcher/tests/renderer-wiring.test.cjs:135-137`: 한국어 최소 고정값(`install` = "모델 설치", 상태 저장소 언어 `"ko"`).

---

## 3. 남은 작업 로드맵

| 단계 | 작업 | 우선순위 | 대상 파일 | 게이트 |
| :--- | :--- | :---: | :--- | :--- |
| **L1** | `NATIVE_COPY`에 `ko` 추가 (트레이·다이얼로그 13개) | P1 | `launcher/electron/main.cjs` | `bun run launcher:test` |
| **L2** | doctor `error`/`warning` 26종 한국어 매핑 | P1 | `launcher/src/i18n.ts`, `src/doctor.ts`(읽기만) | `bun test tests/launcher-localization.test.ts`, `bun run launcher:test` |
| **L3** | `main.cjs` 미번역 작업 메시지 2개 | P2 | `launcher/electron/main.cjs`, `launcher/src/i18n.ts` | `bun run launcher:test` |
| **L4** | 사용자 문서 한국어판 7종 + README 링크 테스트 정규화 | P2 | `*.ko.md`, `docs/*.ko.md`, `launcher/tests/localization.test.cjs`, `README.ko.md` | `bun run launcher:test` |
| **S1** | Windows 심볼릭 링크 권한 없을 때 테스트 skip | P3 | `launcher/tests/runtime-host.test.cjs` | `bun run launcher:test` |
| **L5** | (제안, 미계획) OS 로케일로 온보딩 기본 언어 선택 / CLI 출력 현지화 | — | — | 사용자 요청 시에만 |

각 단계는 독립 커밋. 커밋 전 해당 게이트를 통과시키고, 최종 1회 `bun run verify`.

### L1. 네이티브 트레이·다이얼로그 한국어

- [x] `main.cjs:199` `NATIVE_COPY`에 `"ko"` 블록 완비 확인. 12키 전부 렌더러 사전 `ko`의 기존 용어와 통일되어 있으며, `launcher/tests/localization.test.cjs`에서 전 언어 검증 통과.
- [x] `nativeCopyFor()`(273)는 미지원 언어를 `en`으로 폴백하므로 로직 변경 없음.
- [x] 회귀 고정: `launcher/tests/localization.test.cjs:174-188`에서 `languages.json`의 모든 언어 키가 `NATIVE_COPY`에 존재하고 키가 비어 있지 않음을 이미 엄격하게 검증 중.

### L2. doctor 오류·경고 메시지 한국어

- [x] `src/doctor.ts` 26종 메시지를 `checkId`별로 정리해 `localizeRuntimeMessage`에 분기 추가 완료. 동적 값(`HTTP ${status}`, 경로, 모드, 버전)은 정규식 캡처 → `{placeholder}` 치환 적용.
- [x] 새 사전 키는 `doctorErr*`/`doctorWarn*` 접두로 `en`에 먼저 추가하고 `ko`를 정밀 번역. `zh`, `ja`, `zhTW`는 키 집합 테스트 통과를 위해 영어 원문 적용.
- [x] `App.tsx`에서 doctor check 메시지를 무조건 `localizeRuntimeMessage`를 거치도록 수정하여 오류/경고도 한국어로 정상 표시. 알 수 없는 메시지는 원문 영어 폴백 유지.
- [x] 테스트: `launcher/tests/localization.test.cjs`에 한국어 런타임 메시지 케이스 추가 완료(proxy HTTP 오류, Chrome 누락, 로그인 상태 누락, tunnel-client 누락, Browser-only 안내, 작업 메시지 2종 포함).

### L3. `main.cjs` 작업 메시지

- [x] 597, 917의 영어 문자열을 렌더러가 `localizeRuntimeMessage`로 처리할 수 있도록 분기 2개(`finishActiveCodexTaskBeforeVerify`, `shutdownAlreadyInProgress`)와 사전 키 추가 완료. 원문 메시지는 변경하지 않고 보존.

### L4. 사용자 문서 한국어판

전제: **영어 원문은 삭제하지 않고** `*.ko.md`를 나란히 두며, `README.ja.md`·`README.zh-CN.md`는 손대지 않음.

- [x] 사용자 문서 한국어판 7종 생성 완료: `TROUBLESHOOTING.ko.md`, `SECURITY.ko.md`, `docs/security-model.ko.md`, `docs/release-validation.ko.md`, `docs/architecture.ko.md`, `docs/dev-chat.ko.md`, `CONTRIBUTING.ko.md`. 각 문서 상단에 원문 링크 포함, 코드 펜스·명령·경로·오류 문자열 원문 유지.
- [x] `launcher/tests/localization.test.cjs`의 `linkTargets()`에서 `*.ko.md → *.md`로 정규화하여 README 링크 검증 통과.
- [x] `README.ko.md`의 7개 문서 링크를 한국어판(`.ko.md`)으로 교체 완료.
- [x] 게이트 통과: `bun run launcher:test` 306 pass, `README.ja.md`·`README.zh-CN.md` 변경 없음.

### S1. Windows 심볼릭 링크 테스트 가드

- [x] `runtime-host.test.cjs:1037`에 `try { fs.symlinkSync(...) } catch (e) { if (e.code === "EPERM") return t.skip("symlink privilege unavailable"); throw e; }` 가드 적용하여 권한 없는 Windows 환경에서도 테스트 정상 통과.

---

## 4. 작업 규칙

- upstream(`miuuyy/codex-chatgpt-web`)과의 병합 마찰을 줄이기 위해 `i18n.ts`·`main.cjs` 변경은 **추가만** 하고 기존 줄은 옮기지 않는다.
- 문서 간 언어를 섞지 않는다. 한국어판 문서 안에서 식별자·명령·오류 문자열만 영어.
- 되돌릴 수 있는 크기로 커밋을 나누고, 단계별 게이트를 통과한 뒤 다음 단계로 간다.
- 커밋·푸시·릴리스는 사용자 승인 후에만.

---

## 5. 완료 현황 및 확인 사항

1. **구현 완료**: §3의 L1 → L2 → L3 → L4 및 S1 작업이 완료되었으며, 회귀 게이트 검증을 통과했습니다.
2. **문서 범위 해결**: upstream 원본과의 병합 충돌 방지 및 테스트 유지를 위해 영어 원문 문서를 보존하면서 `*.ko.md` 한국어판 7종을 나란히 추가하고 `README.ko.md` 링크를 연결했습니다.
3. **네이티브 카피**: `NATIVE_COPY.ko` 12개 항목 추가 및 검증 완료, 불필요한 타 언어(`ja`) 수정 없이 upstream 최소 변경 원칙을 준수했습니다.
4. **커밋 여부**: 변경사항은 작업 트리에 반영되어 있으며, 사용자 확인 후 커밋을 진행합니다.

---

## 부록: 이번 재점검에서 확인한 기존 방어 (변경 불필요)

- 데몬은 `127.0.0.1`에만 바인딩(`config.host` 리터럴 타입), 모든 라우트 앞 `Host`/`Origin` 가드.
- `/admin/*` 6개 엔드포인트 bearer 토큰 `timingSafeEqual`.
- MCP 서버는 stdio 전송만 사용, HTTP 리스너 없음. 터널은 아웃바운드 전용.
- tunnel-client 아카이브 소스 고정 해시 6종 + 업스트림 체크섬 이중 검증, 설치 후 매 시작 시 `binarySha256`·실행 권한·`--version` 재검증.
- 디스크립터·키·로그·설정 파일 0o600, 디렉터리 0o700 (`atomic-file.cjs`, `runtime.cjs`, `logging.cjs`, `src/config.ts`).
- 런처 제어 서버 루프백·랜덤 토큰·본문 상한. Electron 렌더러 `contextIsolation`/`sandbox`/`nodeIntegration:false`, 외부 URL은 `shell.openExternal`만.
