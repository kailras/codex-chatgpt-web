# 작업 계획 및 검토 보고서 — 외부 Chrome 세션 캡처(패스키/외부 로그인)의 Windows 플랫폼 확장 및 v9.0.0 베이스라인

- **시작 버전**: `v9.0.0` (독자 포크 시작점, upstream `434b836` v5.0.7 기반)
- **런타임 환경**: Bun 1.4.0, Electron 41.10.7, Windows 10/11 (`win32`)
- **문서 목적**: 내장 웹뷰의 인증 한계(Windows Hello, 패스키, 특수 IdP 등)를 보완하기 위한 "외부 전용 Chrome 로그인 및 세션 런처 Import" 기능의 **Windows(`win32`) 환경 확장** 및 **v9.0.0 독자 포크/한국어 단일화(ko-only) 구조 정립** 결과 보고서입니다.
- **언어 원칙**: 사용자(포크 운영자) 검토용 문서이므로 한국어로 작성하며, 코드 식별자·경로·명령어·오류 문자열은 원문을 유지합니다.

---

## 0. 프로젝트 배경 및 아키텍처 결정 사항

### 0.1 독자 포크 버전 체계 (v9.0.0)
- 자체 포크 수정 작업의 명확한 기준 시작점을 정의하기 위해 버전을 **`v9.0.0`**으로 상향 책정함.
- 동기화 대상: `package.json`, `launcher/package.json`, `src/version.ts`, `scripts/install.sh`.
- 업스트림 릴리스 동기화 검증(`scripts/check-version.ts`의 README GitHub 릴리스 바이너리 다운로드 링크 확인 루프)은 독자 포크 정책에 맞춰 제외 처리함.

### 0.2 한국어 단일화 (ko-only) 정책
- 포크 운영 목적상 다국어 전환 기능이 불필요하므로 불필요한 UI 복잡도를 제거하고 한국어 전용으로 단일화함.
- **온보딩 간소화**: 온보딩 1단계(언어 선택)를 제거하고 `interaction` → `support`의 2단계 구조로 축소 (`stageIndex ? 0 : 1`, 인디케이터 2칸).
- **설정창 정리**: `LanguageMenu` 컴포넌트 및 언어 선택 설정 항목 제거.
- **상태 고정**: 런처 시작 시 `stateStore`의 언어 설정을 `ko`로 보장(`main.cjs`)하고, `copyFor`(`i18n.ts`)의 기본 fallback을 `ko`로 설정.

### 0.3 외부 Chrome 패스키 로그인 Windows 확장의 배경
- 런처 내장 브라우저(`WebContentsView`)는 OS 네이티브 인증(Windows Hello, WebAuthn/Passkey, FIDO2) 지원에 제약이 있어 일부 계정 로그인이 불가능함.
- 기존 macOS(`darwin`) 전용으로 하드코딩되어 있던 세션 추출 및 격리 주입 파이프라인(`captureSystemBrowserLogin`, `passkeyChromeExecutable`)을 **Windows 환경으로 확장**함.

---

## 1. Windows 환경 특유의 기술적 과제 및 해결 방안

1. **Chrome 설치 경로 다양성**:
   - 시스템 64-bit (`%PROGRAMFILES%\Google\Chrome\Application\chrome.exe`)
   - 시스템 32-bit (`%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe`)
   - 사용자 전용 단독 설치 (`%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`)
   - **해결책**: 순차 탐색(Fallback chain) 로직을 `src/config.ts` 및 `launcher/electron/runtime.cjs`에 공통 적용.
2. **프로세스 트리 종료 (Process Tree Termination)**:
   - Windows는 Node.js의 `ChildProcess.kill()`을 호출해도 자식 프로세스(Crashpad, GPU, Network 유틸리티)가 살아남아 SQLite DB 파일(`Cookies` 등)에 핸들 잠금(File Lock)을 유지하는 문제 발생.
   - **해결책**: `taskkill.exe /PID <pid> /T /F` 방식으로 프로세스 트리 전체를 즉시 강제 종료(`terminateLoginProcessTree`).
3. **파일 락 해제 지연 (File Lock Backoff)**:
   - 프로세스 종료 직후에도 Windows 파일 시스템 핸들 해제에 수십~수백 밀리초 지연 발생.
   - **해결책**: 오프라인 Playwright 컨텍스트 재오픈 전 `openSync(..., "r+")` 지수 백오프 검사(`waitForProfileUnlock`) 수행 및 프로필 디렉터리 삭제 시 `EBUSY`/`EPERM`/`ENOTEMPTY` 재시도 안전 함수(`safeRmProfileDir`) 도입.

---

## 2. 세부 구현 단계 및 검토 결과 (W1 ~ W5)

| 단계 | 작업 내용 | 대상 파일 | 구현 및 검토 결과 |
| :--- | :--- | :--- | :--- |
| **W1** | Windows Chrome 실행 경로 자동 탐색 | `src/config.ts`, `launcher/electron/runtime.cjs` | **완료**: 3단계 후보군 체인 정상 동작 확인. *(사후 개선 F1 참조)* |
| **W2** | 프로세스 트리 강제 종료 및 파일 락 안전 처리 | `src/browser-login.ts` | **완료 (우수)**: `taskkill /T /F`, `waitForProfileUnlock`, `safeRmProfileDir` 적용. |
| **W3** | CLI 및 런타임 플랫폼 가드 해제 (`win32` 허용) | `src/browser-login.ts`, `src/cli.ts`, `launcher/electron/runtime.cjs` | **완료**: `process.platform !== "darwin" && process.platform !== "win32"`로 일관되게 확장. |
| **W4** | 런처 렌더러 UI 활성화 및 한국어 연동 | `launcher/src/App.tsx` | **완료**: `passkeyAvailable` 플래그 확장 및 한국어 단일화 UI 통합. |
| **W5** | 단위/통합 테스트 보강 및 Windows 호환성 검증 | `tests/browser-login.test.ts`, `tests/cli.test.ts`, `launcher/tests/runtime-host.test.cjs`, `tests/codex-integration.test.ts` | **완료**: 가상 플랫폼 검증, Windows Chrome 경로 테스트, Windows symlink EPERM 가드 처리. *(사후 개선 F2 참조)* |

---

## 3. 보안 및 격리 원칙 (Security Invariants) 검증

1. **사용자 일상 프로필 보호**:
   - 일상 Chrome 프로필(`%LOCALAPPDATA%\Google\Chrome\User Data`)에 접근하지 않고, `mkdtempSync`로 생성된 격리 임시 디렉터리(`login-profile-*`)에서만 실행.
2. **원자적 즉시 폐기**:
   - 세션 쿠키 캡처 직후 Playwright 컨텍스트를 닫고 `safeRmProfileDir`를 통해 프로필 디렉터리를 강제 파기.
3. **쿠키 살균 및 격리 주입**:
   - `sanitizeBrowserLoginStorageState`를 거쳐 `chatgpt.com` 및 `openai.com` 도메인 데이터만 선별 추출하여 런처 전용 비공개 프로필(`persist:codex-web-gpt-chatgpt`)로 주입.
4. **파일 권한 유지**:
   - 전송 세션 파일 및 마커는 `0600` 모드로 보관.

---

## 4. 검증 파이프라인 실측 결과

2026-09-18 기준 Windows 로컬 환경에서 아래 검증 게이트를 모두 통과(Green)함:

```bash
# 1. 코어 및 CLI 테스트 (22 pass, 0 fail)
bun test tests/browser-login.test.ts tests/cli.test.ts

# 2. 런처 빌드 및 단위 테스트 (308 pass, 0 fail, 3 skipped)
bun run launcher:typecheck
bun run launcher:test

# 3. 전체 타입체크 및 통합 패키지 검증 (Smoke OK, Version Sync OK)
bun run typecheck
bun run verify
```

---

## 5. 사후 권장 개선 과제 (Follow-up Tasks) — 완료

향후 크로스 플랫폼(Linux/macOS) CI 러너를 고려한 경량 방어 과제 적용 완료:

- **F1. `src/config.ts`의 불필요한 플랫폼 가드 제거**: **(완료)**
  - `defaultChromeExecutable`의 `if (platform !== process.platform) return primary;`를 제거하여 비-Windows 환경에서도 Windows 후보군 순차 탐색 테스트가 정상 동작하도록 개선.
- **F2. `tests/cli.test.ts`의 신규 passkey capture 테스트 플랫폼 가드 보강**: **(완료)**
  - `authorized passkey capture validates platform and requires chrome and storage state` 테스트에 `if (process.platform !== "win32") return;`를 추가하여 Linux/macOS 러너에서의 경로 해석 차이 방어.
- **F3. `launcher/src/App.tsx` 미사용 Prop 정리**: **(완료)**
  - `Onboarding` 컴포넌트 시그니처 및 호출부에서 불필요하게 남아있던 `language: Language;` prop 제거 완료.

---

## 6. 최종 실행 체크리스트

- [x] v9.0.0 버전 베이스라인 동기화 (`package.json`, `launcher/package.json`, `src/version.ts`, `scripts/install.sh`)
- [x] 한국어 단일화(ko-only) 온보딩 및 설정 UI 개편 (`App.tsx`, `main.cjs`, `i18n.ts`)
- [x] W1: Windows Chrome 설치 경로 탐색 로직 작성 및 단위 테스트
- [x] W2: Windows 프로세스 트리 종료(`taskkill /T /F`) 및 파일 락 안전 대기(`waitForProfileUnlock`, `safeRmProfileDir`) 적용
- [x] W3: `browser-login.ts`, `cli.ts`, `runtime.cjs`의 플랫폼 가드에 `win32` 추가
- [x] W4: `App.tsx`의 `passkeyAvailable` 플래그 확장 및 한국어 버튼 연동 확인
- [x] W5: 전체 테스트 및 `bun run verify` 통과 확인
- [x] F1~F3: 사후 CI 크로스 플랫폼 방어 코드 다듬기 (`src/config.ts`, `tests/cli.test.ts`, `launcher/src/App.tsx`)

