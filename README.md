# Pipeline Editor

Claude Code 서브에이전트 파이프라인을 시각적으로 설계하고, 실제로 실행까지 할 수 있는 웹 에디터입니다.

![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?logo=tailwindcss&logoColor=white)

## 주요 기능

### 비주얼 파이프라인 에디터
- 32종의 Claude Code 서브에이전트를 **드래그 앤 드롭**으로 캔버스에 배치
- 노드 간 연결로 실행 순서와 병렬 구조를 시각적으로 설계
- 노드 클릭으로 모델(haiku/sonnet/opus), 프롬프트, 라벨 편집
- 엣지 클릭으로 데이터 흐름 라벨 설정

### LLM 기반 파이프라인 자동 생성 (Generate)
- 작업 설명을 자연어로 입력하면 **Claude Code (`claude -p`)**가 최적의 파이프라인을 자동 설계
- API 키 불필요 - Claude Code의 기존 인증을 그대로 사용
- 키워드 기반 로컬 생성 모드도 지원 (오프라인용)

### 대화형 실제 실행 (Run > 실제 실행)
- 설계한 파이프라인을 **실제 프로젝트에서 Claude Code로 실행**
- 브라우저 내 **대화형 터미널** (`xterm.js` + `node-pty` + `WebSocket`)
- 도구 승인/거부, 질문 답변 등 Claude Code와 **직접 상호작용** 가능
- 프로젝트 폴더 선택 버튼 (macOS/Linux/Windows 네이티브 다이얼로그)
- 모달을 닫았다 열어도 터미널 세션 유지

### 실행 시뮬레이션 (Run > 시뮬레이션)
- 파이프라인 실행을 브라우저에서 시뮬레이션
- 모델별 예상 응답 시간 반영 (haiku < sonnet < opus)
- 에이전트별 시뮬레이션 결과 확인 가능

### 내보내기 (Export / Run 탭)
- **실행 프롬프트** - 실행 규칙과 단계별 에이전트 구성을 마크다운 형식으로 출력
- **Task 코드** - `oh-my-claudecode` Task() 호출 코드 생성
- **Mermaid 다이어그램** - 파이프라인 흐름도 생성
- **Node.js 스크립트** - Anthropic SDK 기반 실행 가능한 스크립트 생성
- **JSON** - 파이프라인 구조를 JSON으로 출력

### 프리셋 & 저장
- 6개 프리셋 템플릿 (Review, Implement, Debug, Research, Full Autopilot, Security Audit)
- localStorage 기반 파이프라인 저장/불러오기

## 지원 에이전트 (32종)

| 카테고리 | 에이전트 |
|---------|---------|
| 실행 | executor-low, executor, executor-high |
| 분석 | architect-low, architect-medium, architect |
| 탐색 | explore, explore-medium, explore-high |
| 연구 | researcher-low, researcher |
| 프론트엔드 | designer-low, designer, designer-high |
| 테스트 | qa-tester, qa-tester-high, tdd-guide, tdd-guide-low |
| 보안 | security-reviewer, security-reviewer-low |
| 빌드 | build-fixer, build-fixer-low |
| 리뷰 | code-reviewer, code-reviewer-low, critic |
| 기획 | planner, analyst |
| 문서 | writer |
| 비주얼 | vision |
| 데이터 | scientist-low, scientist, scientist-high |

## 기술 스택

| 기술 | 용도 |
|-----|------|
| React 19 + TypeScript | UI 프레임워크 |
| Vite | 빌드 도구 + 백엔드 미들웨어 |
| @xyflow/react (React Flow v12) | 노드 기반 에디터 |
| TailwindCSS 4 | 스타일링 |
| Zustand | 상태 관리 |
| @xterm/xterm + @xterm/addon-fit | 브라우저 내 터미널 에뮬레이터 |
| node-pty-prebuilt-multiarch | 서버 사이드 가상 터미널 (PTY) |
| ws | WebSocket 서버 (실시간 터미널 통신) |
| claude CLI | 파이프라인 생성 및 실행 |
| localStorage | 파이프라인 영구 저장 |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

> Claude Code CLI (`claude`)가 설치되어 있어야 Generate 및 실제 실행 기능을 사용할 수 있습니다.

## 프로젝트 구조

```
src/
├── App.tsx                        # 메인 레이아웃
├── main.tsx                       # 진입점
├── index.css                      # 글로벌 스타일
├── constants/
│   └── agents.ts                  # 32종 에이전트 정의
├── types/
│   └── index.ts                   # 타입 정의
├── store/
│   └── useFlowStore.ts            # Zustand 상태 관리
├── nodes/
│   └── AgentNode.tsx              # 커스텀 노드 컴포넌트
├── components/
│   ├── Canvas.tsx                 # React Flow 캔버스
│   ├── Sidebar.tsx                # 에이전트 팔레트 (드래그 소스)
│   ├── NodeSettingsPanel.tsx      # 노드 설정 패널
│   ├── Toolbar.tsx                # 상단 툴바
│   ├── ExportModal.tsx            # 내보내기 모달
│   ├── RunPanel.tsx               # 실행 패널 (시뮬레이션 + 대화형 터미널)
│   ├── GeneratorModal.tsx         # 자동 생성 모달
│   ├── PresetSelector.tsx         # 프리셋 선택
│   └── SaveLoadDialog.tsx         # 저장/불러오기
├── utils/
│   ├── graphAnalyzer.ts           # 위상정렬 (그래프 → 단계 추출)
│   ├── exportPrompt.ts            # 프롬프트 텍스트 생성
│   ├── exportJson.ts              # JSON 생성
│   ├── generateExecutionCode.ts   # Task 코드 + Mermaid + Node.js 스크립트
│   ├── executionEngine.ts         # 시뮬레이션 엔진
│   ├── pipelineGenerator.ts       # 키워드 기반 파이프라인 생성
│   ├── llmGenerator.ts            # LLM 기반 파이프라인 생성
│   └── presets.ts                 # 프리셋 파이프라인 정의
└── hooks/
    ├── useLocalStorage.ts         # localStorage 훅
    └── useAutoLoad.ts             # 파이프라인 자동 로드 훅

vite.config.ts                     # Vite 설정 + API 엔드포인트 + WebSocket/PTY 서버
```

## 사용 방법

1. **에이전트 배치** - 좌측 사이드바에서 에이전트를 캔버스로 드래그
2. **연결** - 노드 하단 핸들에서 다른 노드 상단 핸들로 드래그하여 연결
3. **설정** - 노드 클릭 후 우측 패널에서 모델/프롬프트 편집
4. **생성** - Generate 버튼으로 자연어 설명 기반 파이프라인 자동 생성
5. **실행** - Run > 실제 실행 탭에서 프로젝트 폴더 지정 후 대화형 실행
6. **시뮬레이션** - Run > 시뮬레이션 탭에서 실행 흐름 미리보기
7. **내보내기** - Export 또는 Run 탭에서 프롬프트/코드/다이어그램 복사
8. **저장** - Save 버튼으로 localStorage에 파이프라인 저장

## 라이선스

MIT
