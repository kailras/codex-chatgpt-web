# Codex Web GPT (codex-chatgpt-web)

> **ChatGPT Web 계정의 최신 모델을 Codex(Desktop & CLI)에서 API 크레딧 소진 없이 자유롭게 사용하는 로컬 브리지 및 전용 런처**

ChatGPT Web(Plus, Team, Pro, Free/Go)의 공식 모델(GPT-5.6 Sol Pro, GPT-6 Astra, Think, Luna 등)을 별도의 API 과금 없이 Codex에 연결합니다.  
내장 브라우저 자동화 및 OpenAI 공식 MCP 터널을 지원하여, 단순 대화뿐만 아니라 **파일 읽기/수정, 터미널 명령 실행** 등 Codex의 강력한 에이전트 도구를 그대로 사용할 수 있습니다.

---

## 📌 주요 특징

- **무료/구독 계정 활용**: OpenAI API 크레딧(Work/Codex 사용량)을 차감하지 않고, 사용 중인 ChatGPT 웹 플랜의 사용 한도를 활용합니다.
- **네이티브 Codex 연동**: Codex UI의 모델 선택기에서 `ChatGPT Web — ...` 모델을 선택하여 기존 워크플로우 그대로 작업할 수 있습니다.
- **도구 호출(MCP) 완벽 지원**: **Full harness** 모드를 통해 ChatGPT가 Codex의 파일 수정 및 셸 실행 도구를 안전하게 호출합니다.
- **패스키(Passkey / Windows Hello / Touch ID) 로그인 지원**: 내장 브라우저 환경에서 생체 인증이나 보안 키 제약이 있는 계정을 위해 전용 외부 Chrome 창을 통한 안전한 패스키 로그인 및 세션 격리 가져오기를 지원합니다 (macOS 및 Windows).
- **철저한 보안 및 로컬 격리**:
  - 모든 트래픽은 로컬 루프백(`127.0.0.1`)에서만 바인딩됩니다.
  - 아웃바운드 터널 방식을 사용하여 외부 포트 포워딩이나 공인 IP 노출이 필요 없습니다.
- **한국어 단일화 (ko-only)**: 런처 UI, 온보딩, 진단(Doctor) 안내, 시스템 트레이, 사용자 문서 전체가 한국어로 단일화되어 복잡한 언어 설정 없이 직관적으로 사용할 수 있습니다.

---

## ⚙️ 3가지 작동 모드

| 모드 | 작동 방식 | 로컬 도구(파일/명령) | 권장 용도 |
| :--- | :--- | :---: | :--- |
| **Browser-only** (기본) | ChatGPT 웹을 통한 자동 턴 전송 | ❌ 미사용 | 코드 질문, 문서 작성, 단순 리팩터링 등 빠른 대화가 필요할 때 |
| **Full harness** | 공식 MCP 터널을 통한 도구 연동 | ✅ 자동 연동 | 파일 자동 편집, 터미널 명령 실행 등 에이전트 작업이 필요할 때 |
| **Zero Risk** | 프롬프트 직접 복사 및 수동 전송 | 🔒 수동 승인 | 브라우저 DOM 자동화 없이 완벽한 수동 검증과 제어를 원할 때 |

---

## 🚀 빠른 시작 (설치 및 실행)

### 1. 요구 사항
- **Node.js / Bun**: [Bun 1.4.0+](https://bun.sh/) 설치 권장
- **Codex**: [Codex Desktop](https://github.com/openai/codex) 또는 Codex CLI

### 2. 저장소 복제 및 의존성 설치

```bash
git clone https://github.com/kailras/codex-chatgpt-web.git
cd codex-chatgpt-web
bun install
```

### 3. 런처 실행

```bash
bun run app
```

### 4. 단계별 초기 설정

1. **ChatGPT 로그인**:
   - **일반 로그인**: 런처 내장 브라우저 창에서 사용할 ChatGPT 계정으로 로그인합니다.
   - **패스키 로그인**: Windows Hello, Passkey, Touch ID 등을 사용하는 계정인 경우 **[패스키 사용]** 버튼을 클릭하여 전용 외부 Chrome 창에서 로그인을 진행합니다. 임시 채팅이 준비되면 런처로 돌아와 **[계속]**을 클릭해 세션을 가져옵니다.
   - 임시 채팅(Temporary Chat) 입력창이 정상적으로 나타날 때까지 기다립니다.
2. **브라우저 스모크 테스트 (Smoke Test)**:
   - 런처 메인 화면에서 브라우저 스모크 테스트를 실행하여 ChatGPT 컨트롤이 정상 감지되는지 확인합니다.
3. **Codex 모델 설치 (Install models)**:
   - 런처에서 **모델 설치(Install models)** 버튼을 클릭하여 Codex 경로에 모델을 등록합니다.
4. **Codex 재시작**:
   - 실행 중인 모든 Codex Desktop 창과 Codex CLI 프로세스를 **완전히 종료**한 뒤 다시 실행합니다.
5. **모델 선택 및 사용**:
   - Codex의 모델 선택기에서 `ChatGPT Web — ...` 모델을 선택하고 평소처럼 작업을 시작하세요!

---

## 🛠️ Full harness (도구 호출 / MCP) 연동 방법

Codex가 파일 읽기/쓰기 및 터미널 명령을 직접 실행하도록 하려면 **Full harness** 설정을 완료해야 합니다.

1. **런처 MCP 설정**:
   - 런처 메뉴에서 **MCP** 탭으로 이동합니다.
   - 안내에 따라 Tunnel과 API 키를 생성하고 **하네스 연결**을 클릭합니다.
2. **ChatGPT Developer Mode 설정**:
   - ChatGPT 웹 브라우저의 **설정(Settings) → Developer Mode**를 활성화합니다.
   - 커넥터 추가에서 **Tunnel** 방식을 선택하고 커넥터 이름을 반드시 **`Codex Native2`**로 입력합니다.
   - **Authentication: None**, **Allow all actions**를 선택하여 저장합니다.
3. **연동 확인**:
   - 런처의 MCP 화면에서 **런타임 검증**을 클릭하여 `ChatGPT 커넥터 "Codex Native2"를 이용할 수 있습니다`가 표시되는지 확인합니다.

> [!TIP]
> 신뢰할 수 없는 저장소나 외부 의존성을 작업할 때는 로컬 도구를 실행하지 않는 **Browser-only** 모드를 사용하는 것이 안전합니다.

---

## 💻 주요 CLI 명령어

런처 GUI 외에도 터미널 명령어를 통해 직접 제어할 수 있습니다:

```bash
# 상태 점검 및 런타임 진단
bun run src/cli.ts status

# 로그인 브라우저 직접 실행
bun run src/cli.ts login

# 서브에이전트 프로토콜 설정 확인
bun run src/cli.ts subagents status

# 런처 테스트 스위트 실행
bun run launcher:test

# TypeScript 타입 검사
bun run typecheck
```

---

## ❓ 자주 묻는 질문 (FAQ)

### Q. Codex 모델 목록에 ChatGPT Web 모델이 나타나지 않아요.
Codex 프로세스가 기존 설정을 캐싱하고 있을 수 있습니다. 모든 Codex Desktop 및 CLI 창을 완전히 종료한 후, 런처가 실행 중인 상태에서 Codex를 다시 시작해 보세요. 문제가 지속되면 런처의 **설정 → 복구(Repair Codex setup)**를 클릭하세요.

### Q. `openai_base_url changed after setup` 경고가 발생합니다.
CC Switch, Headroom, OpenCodex 등 다른 라우터나 프록시 도구가 동시에 실행 중인 경우 발생합니다. 하나의 도구만 `openai_base_url`을 소유해야 하므로 다른 도구를 종료한 후 런처에서 복구를 실행하세요.

### Q. Windows Hello나 Touch ID 같은 패스키(Passkey) 계정도 지원하나요?
네, 완벽히 지원합니다. 내장 웹뷰는 OS 네이티브 인증(Windows Hello, WebAuthn)에 제약이 있으므로, 런처의 **[패스키 사용]** 버튼을 클릭하세요. 격리된 전용 Chrome 창이 열려 패스키 인증을 마칠 수 있으며, 로그인 완료 후 런처에서 **[계속]**을 누르면 세션 쿠키가 런처 비공개 프로필로 안전하게 자동 주입됩니다.

### Q. 브라우저 세션이나 로그인이 자주 끊기나요?
런처는 별도의 독립된 브라우저 프로필을 유지합니다. 외부 일반 브라우저에서 로그인하더라도 런처 내장 브라우저와는 분리되어 있으므로, 반드시 런처 내(또는 런처의 '패스키 사용' 창)에서 로그인을 완료해 주세요.

---

## 📚 관련 문서

- [문제 해결 가이드 (TROUBLESHOOTING.md)](TROUBLESHOOTING.md) — 일반적인 오류 및 해결 방법
- [아키텍처 개요 (docs/architecture.md)](docs/architecture.md) — 데몬, 브라우저 워커, MCP 터널 구조
- [보안 정책 및 모델 (SECURITY.md)](SECURITY.md) — 로컬 신뢰 경계 및 개인정보 보호
- [기여 안내 (CONTRIBUTING.md)](CONTRIBUTING.md) — 개발 규칙 및 풀 리퀘스트 가이드
- [DEV 채팅 하네스 (docs/dev-chat.md)](docs/dev-chat.md) — 소스 개발 및 테스트 환경 가이드
