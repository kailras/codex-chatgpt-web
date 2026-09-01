# 보안 강화 및 취약점 조치 계획 (Security Hardening Plan) - 검증 완료본

본 문서는 보안 점검을 통해 식별된 위험 요소를 체계적으로 조치하고 방어 체계를 구축하기 위한 단계별 실행 계획입니다.  
**기존 시스템(런처 감시자, 의존성 계약, 테스트 스위트)과의 호환성 검증을 거쳐 부작용이 없도록 보완되었습니다.**

---

## 📌 조치 작업 로드맵 요약

| 단계 | 작업 항목 | 위험도 | 우선순위 | 영향 범위 및 호환성 검증 결과 |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1** | **DNS Rebinding 방어: `Host` 및 `Origin` 헤더 검증** | 높음 | P0 (즉시) | `src/server.ts` (테스트 환경 동적 포트 `port: 0` 및 네이티브 클라이언트 호환성 필수) |
| **Phase 2** | **Chromium CDP 원격 디버깅 포트 오리진 제한** | 중간-높음 | P0 (즉시) | `launcher/electron/main.cjs` (Playwright 연결 호환성 필수) |
| **Phase 3** | **터널 클라이언트 바이너리 해시 고정 (Supply Chain Pinning)** | 낮음-중간 | P1 (단기) | `src/tunnel.ts` (현재 버전 `v0.0.12` 플랫폼별 해시 고정) |
| **Phase 4** | **`/healthz` 외부 접근 차단 및 스키마 계약 보존** | 낮음 | P1 (단기) | `src/server.ts` (⚠️ 필드 제거 시 런처 데몬 감시 실패하므로 스키마 유지 + Host 차단으로 방어) |
| **Phase 5** | **프롬프트 인젝션 완화 및 도구 안전 가이드 보강** | 심각 | P1 (단기) | 문서 및 설정 가이드 (다국어 README 테스트 일치성 준수) |
| **Phase 6** | **종합 회귀 테스트 및 검증** | - | P0 | 전체 테스트 스위트 (`node --test`, `bun test`) |

---

## 🛠️ 세부 실행 계획 및 호환성 안전 가이드

### Phase 1: DNS Rebinding 방어 (`Host` 및 `Origin` 검증)

- [ ] **1.1. `Host` 헤더 검증 헬퍼 구현 (`src/server.ts`)**
  - **호환성 안전 요건**:
    - 단위 테스트(`tests/server-lifecycle.test.ts` 등)에서는 `port: 0`을 사용하여 동적 임의 포트로 서버가 뜹니다.
    - 따라서 `config.port`뿐만 아니라 바인딩된 실제 서버 포트(`server.port`)를 기준으로 검증해야 합니다.
    - 허용 대상: `127.0.0.1:${server.port}`, `localhost:${server.port}`, `127.0.0.1`, `localhost`.
    - 불일치 시 `403 Forbidden` 반환 및 조기 종료.
- [ ] **1.2. 외부 브라우저 `Origin` 헤더 차단 (`src/server.ts`)**
  - **호환성 안전 요건**:
    - Codex 데스크톱/CLI 등 네이티브 HTTP 클라이언트는 통상 `Origin` 헤더를 전송하지 않습니다.
    - 따라서 `Origin` 헤더가 **없는 경우**는 정상 허용해야 합니다.
    - `Origin` 헤더가 **존재하는 경우**(외부 웹 브라우저가 전송한 경우), `http://127.0.0.1:*` 또는 `http://localhost:*` 이외의 도메인은 `403 Forbidden`으로 차단합니다.
- [ ] **1.3. 단위 테스트 작성 및 검증**
  - `tests/server-security.test.ts` 생성하여 악성 `Host: evil.com` 및 악성 `Origin: http://attacker.com` 차단 검증.

---

### Phase 2: Chromium CDP 원격 디버깅 포트 보안 강화

- [ ] **2.1. `--remote-allow-origins` 스위치 적용 (`launcher/electron/main.cjs`)**
  - **호환성 안전 요건**:
    - Playwright 및 내부 브라우저 헬퍼와의 로컬 WebSocket CDP 통신이 끊어지지 않도록, 허용 출처를 정확히 등록합니다:
      `--remote-allow-origins=http://127.0.0.1:${cdpPort},http://localhost:${cdpPort}`
- [ ] **2.2. CDP 포트 및 디스크립터 접근 검증 (`launcher/electron/browser-host.cjs`)**
  - `launcher-browser.json` 파일 권한(0o600) 유지 및 정상 연결 확인.
- [ ] **2.3. 런처 브라우저 스모크 테스트 실행**
  - `node --test launcher/tests/control-server.test.cjs` 등 실행.

---

### Phase 3: 공급망 보안 (터널 클라이언트 바이너리 해시 고정)

- [ ] **3.1. 플랫폼별 SHA-256 해시 상수 정의 (`src/tunnel.ts`)**
  - 고정된 `TUNNEL_VERSION = "0.0.12"`에 대한 공식 아카이브 SHA-256 해시 맵 정의:
    - `tunnel-client-v0.0.12-darwin-arm64.zip`
    - `tunnel-client-v0.0.12-darwin-amd64.zip`
    - `tunnel-client-v0.0.12-windows-amd64.zip`
    - `tunnel-client-v0.0.12-linux-amd64.zip`
- [ ] **3.2. 다운로드 무결성 검증 강화 (`src/tunnel.ts`)**
  - 원격의 `SHA256SUMS.txt` 대조뿐만 아니라, 소스코드에 하드코딩된 해시와 이중 검증하여 원격 체크섬 변조 공격 원천 차단.

---

### Phase 4: `/healthz` 보안 및 스키마 계약 보존

- [ ] **4.1. 런처 감시자(Supervisor) 및 진단 도구 호환성 보존 (`src/server.ts`)**
  - ⚠️ **중요 호환성 분석 결과**:
    - `launcher/electron/runtime-supervisor.cjs`의 `proxyHealth()`는 `service`, `status`, `mode`, `version`, `pid`, `accepting_turns` 필드를 엄격하게 검증합니다.
    - `launcher/electron/main.cjs`의 `catalogVerificationMonitor`는 `successful_model_catalog_requests` 필드를 확인합니다.
    - `src/doctor.ts`의 `proxyCheck()`는 `health.pid === state.daemonPid`를 확인합니다.
    - **따라서 필드를 임의 삭제하면 런처가 데몬을 사망/크래시 상태로 간주하여 무한 재시작을 시도하므로 기존 필드를 그대로 유지해야 합니다.**
- [ ] **4.2. 접근 제어로 정보 노출 차단**
  - Phase 1에서 구현한 `Host` 및 `Origin` 검증을 `/healthz`에도 동일 적용하여, 외부 브라우저(DNS Rebinding)가 해당 내부 진단 정보를 읽지 못하도록 차단.

---

### Phase 5: 프롬프트 인젝션 대응 및 안전장치 문서화

- [ ] **5.1. 보안 권장사항 및 가이드라인 갱신**
  - 대상 파일: `README.md`, `README.ko.md`, `docs/security-model.md`
  - 내용: 신뢰할 수 없는 외부 저장소 작업 시 **Browser-only 모드 사용 권장** 및 `--auto-approve-tool-calls` 위험성 안내.
  - **호환성 안전 요건**:
    - `launcher/tests/localization.test.cjs`가 `README.md`와 `README.ko.md`의 코드 블록 및 링크 타깃을 1:1 비교하므로, 양쪽 파일의 링크와 코드 펜스를 완전히 일치시켜야 함.

---

### Phase 6: 종합 회귀 테스트 및 배포 전 점검

- [ ] **6.1. 로컬라이제이션 및 README 일치성 검증**: `node --test launcher/tests/localization.test.cjs`
- [ ] **6.2. 버전 동기화 점검**: `bun run check-version`
- [ ] **6.3. 단위 및 통합 테스트**: `node --test launcher/tests/*.test.cjs`
- [ ] **6.4. Git diff 검토**: `git diff`로 의도치 않은 변경이 없는지 검토
