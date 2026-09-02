# 보안 강화 및 취약점 조치 계획 (Security Hardening Plan) — 코드 대조 검증본

본 문서는 보안 점검에서 식별된 위험 요소를 조치하기 위한 단계별 실행 계획입니다.
초안(2026-09-02 이전)을 실제 코드와 대조하여 **주장 검증 → 오류 수정 → 누락 보완** 순으로 개정했습니다.
검증 기준 커밋: `77fb0a5`, Bun 1.4.0, Electron 41.10.7, tunnel-client v0.0.12.

---

## 0. 초안 검증 결과 요약

| 초안 주장 | 판정 | 근거 및 수정 내용 |
| :--- | :---: | :--- |
| 테스트가 `port: 0`으로 서버를 띄우므로 `server.port` 기준으로 검증해야 함 | ✅ 확인 | `tests/server-lifecycle.test.ts:13,227,...`에서 `port: 0` 사용, 접속은 `http://127.0.0.1:${server.port}` |
| 네이티브 클라이언트는 `Origin`을 보내지 않으므로 헤더 부재는 허용해야 함 | ✅ 확인 | Codex 라우트 URL은 `routeUrl()` → `http://127.0.0.1:{port}/v1` (`src/codex-integration-shared.ts:207`). 런처 렌더러(`launcher/src`)는 데몬을 직접 fetch하지 않음 |
| 허용 Host에 `localhost` 포함 필요 | ⚠️ 선택 | 저장소 내 모든 호출자(supervisor, doctor, setup, smoke, Codex 라우트)는 `127.0.0.1`만 사용. `localhost`는 수동 curl 편의용으로만 의미 있음 |
| CDP에 `--remote-allow-origins` 추가가 P0 | ❌ 수정 | `main.cjs:771`에 이미 `remote-debugging-address=127.0.0.1` 설정. Electron 41(Chromium 111 이상)은 `Origin` 헤더가 있는 CDP WebSocket을 기본 거부하며, Playwright(Node WebSocket)는 `Origin`을 보내지 않음. 플래그 추가는 실효가 없어 **검증·회귀 테스트 항목으로 격하** |
| `launcher-browser.json` 권한 0o600 "유지" | ✅ 확인 | `writePrivateFileAtomic` → `atomic-file.cjs:41,43` (0o600). Windows는 chmod 무의미(ACL) |
| 터널 아카이브 해시 고정 대상 4종 | ❌ 누락 | `platformAsset()`은 darwin/linux/windows × arm64/amd64 **6종** 지원. `linux-arm64`, `windows-arm64` 누락 |
| `/healthz` 필드 제거 시 런처 감시 실패 | ✅ 확인 | `runtime-supervisor.cjs:541-548`(service/status/mode/version/pid/accepting_turns), `main.cjs:135-143`(successful_model_catalog_requests, last_…_at), `src/doctor.ts:64-90`, `src/setup.ts:189`, `scripts/smoke-release.ts:79-88`, `tests/server-lifecycle.test.ts:609-619` |
| Phase 4를 별도 단계로 분리 | ⚠️ 통합 | Host/Origin 가드는 `fetch()` 진입점에서 전 경로에 적용되므로 Phase 1에 흡수. 필드 보존 요건은 Phase 1 체크리스트로 이관 |
| README에 `--auto-approve-tool-calls` 위험 안내 추가 | ⚠️ 이미 존재 | `README.md:157`, `README.ko.md:111`에 이미 fail-closed 설명 있음. 신규 작성 대신 **신뢰할 수 없는 저장소 지침** 한 단락만 보강 |
| 프롬프트 인젝션 위험도 "심각" | ⚠️ 재표기 | 위험 자체는 실재하나 본 단계 산출물은 문서. 실질 완화(fail-closed 승인, 샌드박스, 턴 토큰)는 이미 코드에 존재 → "문서 보강(P2)"으로 재분류 |
| Phase 6 명령 `node --test`, `bun test` | ❌ 수정 | 루트 테스트는 `bun run test`(= `bun test tests/*.test.ts`), 런처는 `bun run launcher:test`(= `node --test tests/*.test.cjs`, cwd=launcher). CONTRIBUTING은 `bun run verify` 요구 |
| localization 테스트가 README 코드 블록·링크를 1:1 비교 | ✅ 확인 | `launcher/tests/localization.test.cjs:19-29` — `bash`/`powershell` 펜스와 링크 타깃만 비교. 산문 추가는 자유, 링크·펜스 추가 시 양쪽 동기화 필수 |

---

## 1. 조치 로드맵 (개정)

| 단계 | 작업 항목 | 위험도 | 우선순위 | 대상 파일 |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1** | DNS Rebinding 방어: `Host`/`Origin` 검증 (전 경로, `/healthz` 포함) | 높음 | P0 | `src/server.ts`, `tests/server-security.test.ts`(신규), `docs/security-model.md` |
| **Phase 2** | tunnel-client 아카이브 SHA-256 소스 고정 (6개 플랫폼) | 중간 | P1 | `src/tunnel.ts`, `tests/tunnel.test.ts` |
| **Phase 3** | 신뢰할 수 없는 저장소 운용 지침 보강 | 중간 | P2 | `docs/security-model.md`, `SECURITY.md`, `README.md`, `README.ko.md` |
| **Phase 4** | CDP 노출 상태 검증 및 회귀 테스트 고정 (코드 변경 없음) | 낮음 | P2 | `launcher/tests/*.test.cjs`(신규 assertion) |
| **Phase 5** | 회귀 게이트 및 릴리스 준비 | - | P0 | `bun run verify` |

각 Phase는 독립 커밋으로 분리하고, 커밋 전 해당 Phase의 검증 명령을 통과시킵니다.

---

## Phase 1: DNS Rebinding 방어 (`Host` / `Origin` 검증)

### 위협 요약
데몬은 `127.0.0.1`에만 바인딩되지만(`config.host` 리터럴 타입 `"127.0.0.1"`), 공격자 도메인이 `127.0.0.1`로 재해석되면 브라우저가 `Host: evil.example` 헤더로 `/v1/*`, `/healthz`에 도달할 수 있습니다. `/admin/*`는 bearer 토큰으로 보호되지만 `/v1/responses`, `/v1/models`, `/healthz`는 인증이 없습니다.

### 1.1 요청 가드 구현 (`src/server.ts`)
- [x] `startServer()` 내부 `fetch()` 첫 줄, `new URL(req.url)` 직후에 가드 삽입. 모든 라우트(404 포함) 앞에 위치해야 함.
- [x] **Host 검증**: Bun은 `req.url`을 `Host` 헤더로 구성하므로 `url.hostname`을 사용. 허용값 `127.0.0.1`, `localhost`. 포트는 `server.port`(동적 포트 대응)와 일치할 때만 허용.
  - `server` 변수는 `Bun.serve()` 반환 후 할당되므로 가드 내부에서 참조(클로저)해야 함. 테스트에서 `port: 0`이면 `config.port`는 0이라 비교 불가 → 반드시 `server.port`.
- [x] **Origin 검증**: 헤더가 **없으면 허용**. 있으면 `new URL(origin)`으로 파싱해 `protocol === "http:"` 이고 요청 `Host`와 동일한 loopback hostname·실제 포트인 경우만 허용. `Origin: null`, 파싱 실패, 다른 loopback 포트/호스트, 그 외 도메인은 차단.
- [x] 차단 응답: `403` + `formatErrorResponse(403, "invalid_request_error", ...)` 형식으로 통일 (기존 오류 포맷과 일치). 로그는 1회성 `console.warn`으로 Host 값만 기록, 본문은 기록하지 않음.
- [x] 스케치:
  ```ts
  const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);
  function loopbackRequest(url: URL, req: Request, boundPort: number): boolean {
    if (!LOOPBACK_HOSTS.has(url.hostname)) return false;
    if (Number(url.port || 80) !== boundPort) return false;
    const origin = req.headers.get("origin");
    if (origin === null) return true;
    try {
      const parsed = new URL(origin);
      return parsed.protocol === "http:" && parsed.hostname === url.hostname
        && Number(parsed.port || 80) === boundPort;
    } catch { return false; }
  }
  ```

### 1.2 호환성 체크리스트 (변경 없이 통과해야 하는 호출자)
- [x] Codex 라우트: `openai_base_url = http://127.0.0.1:{port}/v1` (`routeUrl()`)
- [x] 런처 감시자: `runtime-supervisor.cjs:530` `http://${config.host}:${config.port}/healthz`
- [x] `src/doctor.ts:64`, `src/setup.ts:189`, `scripts/smoke-release.ts:79`
- [x] `/healthz` 응답 스키마 **불변**: `status, service, version, mode, pid, port, uptime, accepting_turns, successful_model_catalog_requests, last_successful_model_catalog_request_at, active_http_turns, active_browser_turns`
- [x] `/v1/responses` GET의 426 응답도 가드 뒤에 위치(스모크 테스트 `smoke-release.ts:93`이 426 기대)

### 1.3 테스트 (`tests/server-security.test.ts` 신규, `bun test`)
- [x] `Host: evil.example:{port}` → 403 (`/healthz`, `/v1/models`, `/v1/responses`)
- [x] `Host: 127.0.0.1:{port}` + `Origin: http://attacker.example` → 403
- [x] `Host: 127.0.0.1:{port}` + `Origin: null` → 403
- [x] `Host: 127.0.0.1:{port}` + Origin 없음 → 기존 동작(200/426/502 등) 유지
- [x] `Host: localhost:{port}` + `Origin: http://localhost:{port}` → 허용
- [x] `Host: 127.0.0.1:{다른 포트}` → 403
- [x] 기존 `tests/server-lifecycle.test.ts` 전부 통과 (`fetch`는 기본으로 올바른 Host를 보내므로 영향 없음)
- 확인됨(Bun 1.4.0 실측): `fetch(url, { headers: { host: "evil.example:1234", origin: "http://attacker.example" } })`가 그대로 전달되며, 서버의 `new URL(req.url).hostname`은 `Host` 헤더 값(`evil.example`)을 반영함. 포트 없는 `Host: evil.example`은 `url.port === ""`로 들어오므로 스케치의 `Number(url.port || 80)` 비교로 차단됨. 별도 원시 소켓 헬퍼는 불필요.

### 1.4 문서
- [x] `docs/security-model.md` "Network exposure" 절에 항목 추가: 루프백 바인딩 외에 `Host`/`Origin` 검증으로 DNS rebinding을 차단한다는 한 줄. "Same-user local process" 절은 그대로(로컬 프로세스는 여전히 신뢰 경계 내부).

---

## Phase 2: tunnel-client 아카이브 해시 소스 고정

### 현재 상태
`installTunnelClient()`는 같은 GitHub 릴리스의 `SHA256SUMS.txt`를 내려받아 대조합니다(`src/tunnel.ts:117-124`). 릴리스 자산과 체크섬 파일이 함께 교체되면 탐지 불가. 설치 후 manifest 검증은 자체 생성값이므로 최초 설치 시점 무결성은 보장하지 못합니다.

### 2.1 해시 맵 정의 (`src/tunnel.ts`)
- [x] `TUNNEL_VERSION` 옆에 `PINNED_ARCHIVE_SHA256: Record<string, string>` 추가. `platformAsset()`이 생성 가능한 **6개** 자산 전부 포함.
- [x] 값 (2026-09-02 `SHA256SUMS.txt` 취득, `windows-amd64`는 실제 아카이브 26,603,136 bytes 다운로드 후 로컬 sha256 재계산으로 일치 확인):

  | 자산 | SHA-256 |
  | :--- | :--- |
  | `tunnel-client-v0.0.12-darwin-amd64.zip` | `33de53aec680faafedc795f8f8268d6861577bddb871cb2d49529c91f88c2009` |
  | `tunnel-client-v0.0.12-darwin-arm64.zip` | `42fb3138dc9c081d5777cb7e8bd1e041cc48b67c4978dbab3c5167ca1aabca02` |
  | `tunnel-client-v0.0.12-linux-amd64.zip` | `2bb693bd7b5cd28da7ce09cd9e309529dbb33b7cc9dc0058e62a064688f92c81` |
  | `tunnel-client-v0.0.12-linux-arm64.zip` | `6813878a3edb82ebebb32fe5a859bc6327a81cce5bc7b635a2313174d26365d6` |
  | `tunnel-client-v0.0.12-windows-amd64.zip` | `2a2804933924e38a502d62b61f0266cb80d56d65744f4c29876b2bf9c1544356` |
  | `tunnel-client-v0.0.12-windows-arm64.zip` | `65ab54221554481bb1c23b6015b99abe0b7f79b08593f4fb17a9e2e25532281d` |

- [ ] 커밋 전 **다른 네트워크/기기에서** 나머지 5개 자산 중 최소 1개를 내려받아 재계산 확인 (단일 경로 취득값을 그대로 신뢰하지 않음).
  - 현재 작업 환경에서는 다른 네트워크/기기 검증을 수행하지 못했으므로 릴리스 운영자의 수동 게이트로 남김.

### 2.2 검증 로직 강화
- [x] 다운로드 후 순서: (1) 소스 고정 해시와 비교 → 불일치 시 `Checksum mismatch (pinned)` 오류, (2) 기존 `SHA256SUMS.txt` 대조 유지(업스트림 체크섬 파일 변조 감지용, 이중 검증).
- [x] 고정 해시가 없는 자산명은 다운로드 전에 실패 (`platformAsset()` 직후 조회).
- [x] `TUNNEL_VERSION` 상향 절차 주석 추가: 버전 변경 시 6개 해시를 함께 갱신해야 하며, 누락 시 테스트가 실패하도록 설계.

### 2.3 테스트 (`tests/tunnel.test.ts`)
- [x] 기존 "pins the fixed tunnel-client" 테스트 확장: 3 OS × 2 arch 조합 전부에 대해 `PINNED_ARCHIVE_SHA256[asset]`가 64자 hex로 존재하는지 확인.
- [x] 해시 비교를 순수 함수(예: `assertPinnedArchive(asset, bytes)`)로 분리해 불일치 → throw, 일치 → 통과를 단위 테스트.
- 참고: `installTunnelClient()` 자체는 현재 테스트 커버리지가 없음(네트워크 의존). 이번 단계에서 통합 테스트는 추가하지 않고 순수 함수만 검증.

---

## Phase 3: 신뢰할 수 없는 저장소 운용 지침 보강 (문서)

이미 존재하는 내용은 중복 작성하지 않습니다 (`README.md:157` fail-closed 설명, `docs/security-model.md` "Prompt injection and destructive tool use" 절).

- [x] `docs/security-model.md` Prompt injection 절에 한 단락 추가: 신뢰할 수 없는 저장소·PR·의존성 작업 시 Browser-only 모드 권장, Full 모드는 신뢰 워크스페이스 한정, `--auto-approve-tool-calls`는 신뢰 저장소에서도 비권장.
- [x] `SECURITY.md` 3번째 단락에 Browser-only 권장 한 문장 추가.
- [x] `README.md`/`README.ko.md` Full 모드 절 끝에 한 문장씩 추가. **새 링크·코드 펜스는 추가하지 않음** → `localization.test.cjs` 영향 없음. 링크를 추가해야 한다면 양쪽 파일에 동일 타깃으로 추가.
- [x] 검증: `bun run launcher:test` 중 localization 테스트 통과.

---

## Phase 4: CDP 노출 상태 검증 (코드 변경 없음)

### 검증 결과
- `main.cjs:771-772`: `remote-debugging-address=127.0.0.1`, 포트는 `findFreePort()` 랜덤.
- Electron 41.10.7(Chromium 111 이상): `Origin` 헤더가 있는 DevTools WebSocket 연결은 `--remote-allow-origins` 미설정 시 기본 거부. Playwright `connectOverCDP`(`src/launcher-browser-host.ts:215`)는 Node WebSocket으로 `Origin` 없이 연결하므로 영향 없음.
- 따라서 `--remote-allow-origins=http://127.0.0.1:${cdpPort}` 추가는 브라우저 기반 공격 표면을 줄이지 못하고(이미 차단), 정상 경로도 바꾸지 않음. **추가하지 않음.**
- 잔여 위험은 동일 OS 사용자 로컬 프로세스의 CDP 접속이며, `docs/security-model.md` "Non-goals"에 명시된 신뢰 경계 외부 항목.

### 4.1 회귀 고정
- [x] `launcher/tests/` 기존 테스트 파일(예: `packaging-contract.test.cjs` 또는 신규 `cdp-contract.test.cjs`)에 `main.cjs` 소스 정규식 assertion 추가: `remote-debugging-address` 값이 `"127.0.0.1"`이고 `remote-allow-origins=*`가 등장하지 않음.
- [x] `src/launcher-browser-host.ts:160`의 `ws://127.0.0.1:` 프리픽스 검사가 유지되는지 기존 `tests/launcher-browser-host.test.ts`에서 확인(있으면 유지, 없으면 assertion 추가).
- [x] `docs/security-model.md` "Browser session theft" 절에 CDP 포트가 루프백 전용·랜덤 포트·디스크립터 파일은 사용자 전용 권한이라는 한 줄 추가(선택).

---

## Phase 5: 회귀 게이트 및 릴리스 준비

- [x] Phase별 최소 게이트
  - Phase 1: `bun run test` (서버 테스트 포함), `bun run typecheck`
  - Phase 2: `bun run test`, `bun run typecheck`
  - Phase 3: `bun run launcher:test` (localization)
  - Phase 4: `bun run launcher:test`
- [x] 전체 게이트: `bun run verify` (check-version → audit → launcher:audit → typecheck → test → launcher:typecheck → launcher:test → launcher:build → 런타임 번들 → third-party notices → smoke-release). 시간이 오래 걸리므로 Phase 커밋 완료 후 1회 실행.
- [x] `smoke-release.ts`는 실제 데몬을 띄워 `/healthz`, `/v1/models`, `/v1/responses` 응답 코드를 확인하므로 Phase 1 가드가 정상 트래픽을 차단하지 않는다는 종단 증거가 됨.
- [x] `git diff --stat`으로 의도 외 변경 확인. 해시 상수·문서 외에 `launcher/electron/*.cjs` 변경이 없어야 함.
- [x] 릴리스 준비: 보안 수정이므로 패치 버전(`4.0.8`)을 상향하고 `bun run check-version`을 통과했으며, 릴리스 노트에 DNS rebinding 방어와 터널 해시 고정을 명시.

커밋 생성·게시 자체는 사용자 승인 없이 수행하지 않았습니다. 위의 다른 네트워크/기기 해시 확인과 함께 릴리스 운영자가 커밋 전에 처리해야 합니다.

---

## 부록: 이번 검증에서 확인된 기존 방어 (변경 불필요)

- `/admin/*` 5개 엔드포인트: `timingSafeEqual` 기반 bearer 토큰 검증 (`src/server.ts:656-661`).
- MCP 서버는 stdio 전송만 사용 (`mcp-server.ts:496`), HTTP 리스너 없음.
- 터널은 아웃바운드 전용이며 로컬 Responses 포트를 외부에 노출하지 않음 (`src/tunnel.ts` `connectTunnel`은 MCP 커맨드만 등록).
- 설치된 tunnel-client는 매 시작 시 manifest의 `binarySha256`와 실행 권한, `--version` 출력을 재검증.
- 디스크립터·키·로그 파일은 `0o600`으로 생성 (`atomic-file.cjs`, `runtime.cjs`, `logging.cjs`).
