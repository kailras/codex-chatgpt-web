<h1 align="center">Codex용 ChatGPT Web</h1>

<p align="center">
  <strong>ChatGPT Web(Pro 포함)을 Codex의 네이티브 모델로 사용하세요.</strong><br>
  모델 티어를 전환하면서 기존 워크플로우를 그대로 유지할 수 있습니다.
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <a href="TROUBLESHOOTING.md">문제 해결</a> · <a href="SECURITY.md">보안</a> · <a href="CONTRIBUTING.md">기여 안내</a>
</p>

<p align="center">
  <a href="https://github.com/miuuyy/codex-chatgpt-web/actions/workflows/ci.yml"><img src="https://github.com/miuuyy/codex-chatgpt-web/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT 라이선스"></a>
  <img src="https://img.shields.io/badge/macOS-arm64%20%7C%20x64-black?logo=apple" alt="macOS arm64 및 x64">
  <img src="https://img.shields.io/badge/Windows-x64-0078d4?logo=windows11" alt="Windows x64">
  <img src="https://img.shields.io/badge/Linux-x64-fcc624?logo=linux&logoColor=black" alt="Linux x64">
  <img src="https://img.shields.io/badge/Free_AI-no_API_fees-10a37f" alt="API 비용 없는 무료 AI">
</p>

Free 및 Go 계정은 Codex의 네이티브 모델 선택기에서 **ChatGPT Web — Luna**를 사용할 수 있습니다. reasoning 선택기가 표시되는 계정은 구독 상태에 따라 **Instant**, **Medium**, **High**, **Extra High**, **Pro**를 그대로 유지합니다. 브리지는 현재 컴파일된 Codex 작업 컨텍스트를 새로운 ChatGPT 임시 채팅(Temporary Chat)으로 전송하고, 이미지를 첨부하며, 표시되는 reasoning, 도구 활동 및 Markdown을 동일한 Codex 작업으로 다시 스트리밍합니다.

<p align="center">
  <img src="assets/demo.gif" alt="네이티브 Codex 하네스를 사용하는 실시간 ChatGPT Web 턴" width="960">
</p>

```text
Codex 작업 ──Responses + SSE──▶ codex-chatgpt-web ──임베디드 브라우저──▶ ChatGPT
     ▲                                   │                                     │
     └──────── 네이티브 UI, 컨텍스트, 이미지, 추적 및 도구 라이프사이클 ───────┘
```

Codex는 네이티브 작업, 컨텍스트 라이프사이클, UI 및 도구 하네스를 유지합니다. 로컬 Responses 브리지는 선택된 모델의 작업만을 해당 작업에 바인딩된 ChatGPT 임시 채팅으로 라우팅합니다. Full 모드에서는 다음 컴팩션 경계까지 MCP가 ChatGPT를 동일한 Codex 작업의 도구로 다시 연결합니다.

> [!TIP]
> **[ChatGPT Persona Voice](https://github.com/miuuyy/ChatGPT-Persona-Voice)**도 개발했습니다. ChatGPT/Codex의 음성을 로컬 환경에서 거의 실시간으로 변경해 주는 앱입니다. 사용자 계정, 브라우저 세션 또는 ChatGPT 요청에 일절 관여하지 않으므로 계정 차단 위험이 없습니다. 마음에 드신다면 한번 사용해 보세요.

## 주요 특징

- **네이티브 Codex 모델.** ChatGPT Web은 Codex의 모델 선택기에서 직접 실행되며, 기존 작업 UI, 컨텍스트 라이프사이클, 스트리밍, 추적(tracing) 및 도구 표시는 그대로 유지됩니다.
- **MCP를 통한 완전한 Codex 하네스.** Full 모드에서는 Pro를 포함하여 로그인된 계정에서 제공하는 모든 effort 수준에서 활성 작업의 파일 시스템, 셸, 이미지, 승인, 구성된 도구/앱을 활용할 수 있습니다.
- **연속적인 작업 세션 및 네이티브 컴팩션.** 연속된 메시지는 작업에 바인딩된 하나의 임시 채팅을 재사용합니다. 컨텍스트 한계에 도달하면 유지 중인 에이전트가 체크포인트를 기록한 후 Codex가 깨끗한 새 채팅을 시작합니다. 해당 채팅이 닫힌 경우 정규 Codex 히스토리가 대체 수단(fallback)으로 제공됩니다.
- **단일 크로스 플랫폼 런처.** macOS, Windows, Linux용 앱 하나로 로그인, 모델 설정, MCP 안내, 헬스 체크, 안전한 진단, 최대 5개의 표시 가능한 작업 바인딩 브라우저 탭을 관리합니다.
- **Fail-closed(장애 시 즉시 차단) 동작.** 모델이나 도구가 누락되거나 ChatGPT UI가 변경된 경우, 경로를 조용히 변경하거나 기능을 임의로 축소하는 대신 명시적인 오류를 반환합니다. 엔드투엔드 지원 범위는 [릴리스 검증](docs/release-validation.md) 문서에 정리되어 있습니다.

임시 채팅(Temporary Chat)은 ChatGPT의 개인정보 보호 모드이며 익명화나 로컬 전용 추론이 아닙니다. 프롬프트는 여전히 OpenAI에서 처리되며 계정 설정 및 OpenAI의 [임시 채팅 정책](https://help.openai.com/en/articles/8914046-temporary-chat-faq)이 적용됩니다. 본 프로젝트는 비공식 프로젝트이며, 사용자는 관련 OpenAI 이용약관 및 워크스페이스 정책을 준수할 책임이 있습니다.

## 빠른 시작

데스크톱 런처를 설치하거나 업데이트합니다. 기존 설치를 업데이트하거나 복구하려면 런처를 종료하고 동일한 명령어를 다시 실행하세요. ChatGPT 프로필과 런처 구성 설정을 유지한 채 애플리케이션과 내장 런타임이 교체됩니다.

**macOS 또는 Linux**

```bash
curl -fsSL https://github.com/miuuyy/codex-chatgpt-web/releases/latest/download/install-launcher.sh | sh
```

**Windows PowerShell**

```powershell
irm https://github.com/miuuyy/codex-chatgpt-web/releases/latest/download/install-launcher.ps1 | iex
```

그런 다음 앱에서 세 가지 확인 사항을 완료합니다.

1. 런처의 내장 ChatGPT 브라우저에서 직접 로그인합니다. 로그인 페이지와 ID 제공자(IdP) 창은 런처가 소유한 동일한 비공개 브라우저 프로필 내에 유지되며, 브라우저 간에 세션이 복사되지 않습니다.
2. 브라우저 스모크 테스트를 실행합니다.
3. **Install models**를 클릭하고 Codex를 한 번 재시작한 뒤 **ChatGPT Web — …** 모델을 선택합니다.

런처는 설정 중에 현재 계정의 ChatGPT 제어 옵션을 자동으로 감지합니다. Free/Go 계정은 Luna만 표시되고, Pro는 로그인한 계정에서 제공하는 경우에만 표시됩니다. 별도의 **MCP** 페이지는 선택 사항이며, 터미널 명령어 없이 Full 하네스 설정을 안내합니다.

패키징된 런처는 내장 브라우저에서 로그인과 ChatGPT 모델 턴을 유지합니다. 모델 API 키, 별도로 설치된 Chrome/Chromium, 시스템 Node/Bun 또는 프로젝트 관리 브라우저 다운로드가 필요하지 않습니다.

**소스에서 실행**

```bash
git clone https://github.com/miuuyy/codex-chatgpt-web.git && \
cd codex-chatgpt-web && \
bun run app
```

이 소스 실행 경로에는 Bun 1.4.0이 필요합니다. 해당 명령어는 고정된 종속 항목을 설치하고 앱을 실행합니다.

## 모드

| 모드 | 모델 | 로컬 Codex 도구 | 추가 설정 |
| --- | --- | --- | --- |
| **Browser-only** | Free/Go: Luna; Plus: Instant–High; Pro: Extra High 및 Pro 추가 | 지원 안 함 (Codex에 경고 표시) | 없음 |
| **Full harness** | Free/Go: Luna; Plus: Instant–High; Pro: Extra High 및 Pro 추가 | Pro를 포함한 모든 표시된 effort에서 지원 | OpenAI 터널 + ChatGPT 커넥터 |

모델 선택기의 각 항목은 고정된 하나의 ChatGPT 모드를 가집니다. Codex에는 내장된 Effort 및 Speed 행이 계속 표시되지만, 이를 변경해도 선택된 브라우저 모델이 조용히 바뀌지 않습니다. Full 모드에서는 사용 가능한 모든 effort가 동일한 턴 바인딩 MCP 기능을 받습니다. Pro에 별도의 제한이나 축소된 도구 계약은 없습니다.

## Full 하네스

Full 모드는 공식 [OpenAI tunnel-client](https://github.com/openai/tunnel-client)를 통해 ChatGPT의 도구 호출을 현재 Codex 작업에 다시 연결합니다. 터널은 아웃바운드 방식이며 공인 IP를 노출하거나, 인바운드 포트를 열거나, 라우터 포트 포워딩을 설정할 필요가 없습니다.

> [!WARNING]
> 이름이 **Codex Native2**인 **새** 커넥터를 생성하고 권한을 **Allow all actions**로 설정하세요. 이전 **Codex Native** 커넥터의 이름을 바꾸거나 새로고침하거나 재사용하지 마세요. ChatGPT는 커넥터 식별자별로 공개 MCP 계약을 캐시하므로, **Allow low-risk actions**로 설정하면 명령과 패치가 Codex 하네스에 도달하기 전에 차단됩니다.

1. 필수 런처 설정을 완료합니다.
2. 런처에서 **MCP**를 엽니다. ChatGPT 커넥터를 사용할 동일한 OpenAI 계정에서 Tunnel과 일반 API 키를 생성합니다. 키 생성은 무료이며 모델 API 크레딧을 소비하지 않습니다.
3. Tunnel ID와 API 키를 붙여넣은 다음 **Connect harness**를 클릭합니다.
4. ChatGPT 설정에서 **Developer Mode**를 활성화합니다. **Tunnel**을 사용하는 **새** 커넥터를 생성하고 해당 Tunnel을 선택한 뒤 **Authentication**을 **None**으로 설정하고 이름을 정확히 **Codex Native2**로 지정합니다.
5. 이전 **Codex Native** 커넥터가 존재하는 경우 그대로 둡니다. 이름을 바꾸거나 새로고침하지 마세요. ChatGPT는 커넥터 식별자별로 공개 MCP 계약을 캐시하며, 이번 릴리스는 새로운 직접 턴 토큰 계약을 사용합니다. **Codex Native2**의 **Permissions** 아래에서 **Allow all actions**를 선택하세요. **Allow low-risk actions**는 명령과 패치가 이 런타임에 도달하기 전에 차단합니다. 외부 Codex 하네스는 자체 샌드박스와 승인을 계속 적용합니다.
6. **Verify runtime**을 실행합니다. **Codex Native2**가 정확히 선택됩니다. **Codex Native**만 발견되면 레거시 커넥터를 수락하는 대신 명시적인 마이그레이션 오류와 함께 검증에 실패합니다.

쓰기/수정 작업은 ChatGPT 워크스페이스 및 관리자 정책에서도 허용되어야 합니다. [개발자 모드 및 MCP 앱](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)을 참고하세요. 예상치 못한 승인 프롬프트는 `--auto-approve-tool-calls`가 명시적으로 활성화되지 않는 한 fail-closed(차단)됩니다. 해당 옵션은 영구적인 권한 부여가 아니라 **Allow once**만을 클릭합니다.

신뢰할 수 없는 저장소, PR 또는 의존성 변경을 작업할 때는 Browser-only 모드를 권장하며, Full 모드는 신뢰할 수 있는 워크스페이스로 한정하고 그 안에서도 `--auto-approve-tool-calls`는 사용하지 않는 것이 좋습니다.

## 운영

안전한 로컬 진단에는 **Activity**를 사용하고, 엔드투엔드 상태 확인에는 **Settings → Run doctor**를 사용하세요. Settings에서는 보존된 브라우저 턴을 취소하거나 제거 전에 Codex 연동을 삭제할 수도 있습니다. 모든 브라우저 체크포인트에서 스크린샷이 필요한 경우에만 `CODEX_CHATGPT_WEB_BROWSER_DIAGNOSTICS=1`을 설정하세요.

새로 설치한 경우 백엔드 간 서브에이전트에 **Compatibility V1**을 사용합니다. **Native**는 Codex 자체 기능 설정을 보존하고 일반 텍스트 기반의 Web-to-Web V2 위임을 활성화합니다. 프로토콜을 변경한 후에는 Codex를 재시작하고 새 작업을 시작하세요.

```bash
codex-chatgpt-web subagents status
codex-chatgpt-web subagents compatibility-v1
codex-chatgpt-web subagents native
```

## 제한 사항 및 보안

- 본 도구는 비공식 브라우저 자동화 도구이며 OpenAI API가 아닙니다. ChatGPT UI가 변경되면 선택자(selector)가 깨질 수 있으며, 변경 사항 발생 시 모델이나 전송 방식을 조용히 변경하지 않고 명시적으로 실패합니다.
- 브라우저 상태는 민감한 로그인 정보이며, 루프백 리스너는 동일한 로컬 사용자로 실행되는 프로세스에서 접근할 수 있습니다. 런처 프로필을 공유하지 마시고 신뢰할 수 있는 워크스테이션에서 사용하세요.
- 릴리스 패키지는 현재 macOS 13+ (arm64/x64), Windows x64 및 Linux x64를 대상으로 합니다. 런타임, 테스트, 패키징은 CI에서 세 플랫폼 모두에 대해 검증됩니다. 계정에 바인딩된 브라우저 및 MCP 플로우는 별도의 [릴리스 검증](docs/release-validation.md)을 따릅니다.
- 빌드가 아직 플랫폼 서명되지 않았으므로 Gatekeeper 또는 SmartScreen 경고가 표시될 수 있습니다. 설치 프로그램은 설치 전에 게시된 SHA-256 매니페스트를 검증합니다.

Full 모드를 활성화하기 전에 [아키텍처](docs/architecture.md) 및 [보안 모델](docs/security-model.md) 전문을 읽어보세요. 취약점은 [SECURITY.md](SECURITY.md)를 통해 보고해 주시기 바랍니다.

## 개발

```bash
bun run app
bun run dev:launcher
bun run src/cli.ts dev status
bun run dev:chat compaction-lab "Reply with exactly: DEV READY"
bun run verify
bun run smoke:subagents
bun run app:package
```

`dev:launcher`는 `~/.codex-chatgpt-web-dev` 아래에 두 번째 런처 프로필을 시작합니다. 여기에는 별도의 Electron 상태, 브라우저 쿠키/로그인, ChatGPT 계정, 설정, 샌드박스 처리된 `CODEX_HOME`, 채팅, 진단, 브로커, 터널 프로필이 포함됩니다. 일반 런처와 나란히 실행할 수 있으며 Responses 데몬을 시작하거나 Codex를 변경하지 않습니다. 선택적인 Full 설정은 전용 ChatGPT 커넥터 이름인 `Codex Native2 DEV`를 사용하여 격리된 MCP 터널만을 시작하고 관리합니다.

`dev:chat`은 이름이 지정된 지속적인 합성(synthetic) 외부 Codex 하네스입니다. 격리된 런처 브라우저, 임시 채팅, 프롬프트 컴파일러, Responses 파서, 컴팩션 핸들러를 통해 현재 작업 트리를 실행합니다. 선택적인 Full 설정은 MCP 커넥터와 브로커도 테스트하며 도구 효과는 명시적인 시뮬레이션 영수증으로 반환됩니다. Browser-only 채팅은 외부 도구를 노출하지 않습니다. Responses 리스너를 열거나 `openai_base_url`을 변경하거나 실행 중인 데몬을 중지하거나 17841 포트를 점유하지 않습니다.
메시지 없이 실행하면 `/status`, `/fill 30000`, `/compact`, `/model`, `/reset` 명령어를 사용할 수 있습니다. **DEV** 레이블이 지정된 창 내에서 한 번 로그인하고 프로필을 초기화하세요. 시뮬레이션 도구 라운드가 필요한 경우에만 선택적 Full 하네스를 구성하세요. 런처는 DEV 터널을 대기 상태로 유지하며 이름이 지정된 채팅은 필요에 따라 브로커를 연결합니다. 프로덕션 자격 증명과 `Codex Native2` 커넥터는 절대 암묵적으로 재사용되지 않습니다. [DEV 채팅 하네스](docs/dev-chat.md)를 참조하세요.

- [아키텍처](docs/architecture.md)
- [DEV 채팅 하네스](docs/dev-chat.md)
- [보안 모델](docs/security-model.md)
- [문제 해결](TROUBLESHOOTING.md)
- [기여 안내](CONTRIBUTING.md)

## Star History

<a href="https://www.star-history.com/?repos=miuuyy%2Fcodex-chatgpt-web&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=miuuyy/codex-chatgpt-web&type=date&theme=dark&legend=top-left&sealed_token=hBVvg_eOjfMFDrfyeo5FPQkIwcvBEmXc6F7ZoOKnfFE4KPCs67o34w4XwVuM-bHGnKR-SKCAN_TSTWrzuqSBNU-RjNZCLT4f-xNs9qcDhciQtemxHKuuFj0N5YNqZIihdaQfakrh2ANhOrvP0K2LmLXX2zbsYyVaYZknyTnlYeIS_mOGvMcO32ZmPCHK">
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=miuuyy/codex-chatgpt-web&type=date&legend=top-left&sealed_token=hBVvg_eOjfMFDrfyeo5FPQkIwcvBEmXc6F7ZoOKnfFE4KPCs67o34w4XwVuM-bHGnKR-SKCAN_TSTWrzuqSBNU-RjNZCLT4f-xNs9qcDhciQtemxHKuuFj0N5YNqZIihdaQfakrh2ANhOrvP0K2LmLXX2zbsYyVaYZknyTnlYeIS_mOGvMcO32ZmPCHK">
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=miuuyy/codex-chatgpt-web&type=date&legend=top-left&sealed_token=hBVvg_eOjfMFDrfyeo5FPQkIwcvBEmXc6F7ZoOKnfFE4KPCs67o34w4XwVuM-bHGnKR-SKCAN_TSTWrzuqSBNU-RjNZCLT4f-xNs9qcDhciQtemxHKuuFj0N5YNqZIihdaQfakrh2ANhOrvP0K2LmLXX2zbsYyVaYZknyTnlYeIS_mOGvMcO32ZmPCHK">
  </picture>
</a>

## 면책 조항

본 소프트웨어는 독립적인 소프트웨어이며 OpenAI와 제휴하거나 보증을 받지 않았습니다. 본인 소유의 계정으로만 사용하고 관련 [이용약관](https://openai.com/policies/terms-of-use/) 및 워크스페이스 정책을 준수하여 사용하세요. 인증이나 액세스 제어를 우회하지 않습니다.
