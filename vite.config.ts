import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

const AVAILABLE_AGENTS = [
  'explore (haiku): 빠른 코드베이스 탐색',
  'explore-medium (sonnet): 심층 코드 흐름 분석',
  'explore-high (opus): 아키텍처 수준 탐색',
  'researcher (sonnet): 외부 문서/API 조사',
  'researcher-low (haiku): 빠른 문서 조회',
  'architect (opus): 아키텍처 설계 (READ-ONLY)',
  'architect-medium (sonnet): 설계 검토',
  'architect-low (haiku): 빠른 코드 분석',
  'analyst (opus): 요구사항 분석',
  'planner (opus): 전략 기획',
  'critic (opus): 계획 비평',
  'executor-low (haiku): 단일 파일 간단 수정',
  'executor (sonnet): 표준 기능 구현',
  'executor-high (opus): 복잡한 멀티 파일 구현',
  'designer-low (haiku): 간단한 스타일링',
  'designer (sonnet): UI/UX 컴포넌트 구현',
  'designer-high (opus): 디자인 시스템',
  'build-fixer-low (haiku): 간단한 빌드 에러 수정',
  'build-fixer (sonnet): 빌드/컴파일 에러 해결',
  'security-reviewer-low (haiku): 빠른 보안 스캔',
  'security-reviewer (opus): 종합 보안 검토',
  'code-reviewer-low (haiku): 빠른 코드 체크',
  'code-reviewer (opus): 종합 코드 리뷰',
  'qa-tester (sonnet): 기능 테스트',
  'qa-tester-high (opus): 종합 QA',
  'tdd-guide (sonnet): TDD 워크플로우',
  'tdd-guide-low (haiku): 빠른 테스트 제안',
  'writer (haiku): 문서 작성',
  'vision (sonnet): 이미지/다이어그램 분석',
  'scientist-low (haiku): 빠른 데이터 확인',
  'scientist (sonnet): 데이터 분석/시각화',
  'scientist-high (opus): 복잡한 연구/ML',
].join('\n- ')

const SYSTEM_PROMPT = `당신은 Claude Code 서브에이전트 파이프라인 설계 전문가입니다.
사용자의 작업 설명을 분석하여 최적의 에이전트 파이프라인을 설계합니다.

## 사용 가능한 에이전트
- ${AVAILABLE_AGENTS}

## 규칙
1. 각 에이전트의 prompt는 해당 작업에 맞게 **구체적이고 상세하게** 작성하세요.
2. 같은 단계(step)의 에이전트들은 병렬로 실행됩니다 - edges에서 동일 소스에서 연결.
3. 비용 효율: 간단한 작업은 haiku, 복잡한 작업은 opus.
4. 최소한의 에이전트로 최대 효과.
5. prompt는 그 에이전트가 정확히 무엇을 해야 하는지 구체적으로.
   BAD: "프로젝트 구조 분석"
   GOOD: "src/ 디렉토리의 React 컴포넌트 구조 파악, API 호출 패턴 분석, 상태 관리 방식 확인"

## 응답 형식 (JSON만, 다른 텍스트 없이)
{
  "id": "generated",
  "name": "파이프라인 이름",
  "description": "설명",
  "nodes": [
    { "agentType": "에이전트ID", "prompt": "구체적 지시" }
  ],
  "edges": [[소스인덱스, 타겟인덱스], ...]
}`

function pipelineGeneratorPlugin() {
  return {
    name: 'pipeline-generator-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
      server.middlewares.use('/api/generate-pipeline', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { description } = JSON.parse(body) as { description: string }

            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' }))
              return
            }

            const { default: Anthropic } = await import('@anthropic-ai/sdk')
            const client = new Anthropic({ apiKey })

            const response = await client.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              messages: [
                { role: 'user', content: `다음 작업에 최적의 에이전트 파이프라인을 설계해주세요:\n\n${description}` },
              ],
            })

            const text = response.content[0].type === 'text' ? response.content[0].text : ''
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('JSON 파싱 실패')

            const pipeline = JSON.parse(jsonMatch[0])
            if (!pipeline.nodes) throw new Error('nodes 없음')
            if (!pipeline.id) pipeline.id = 'generated'
            if (!pipeline.edges) pipeline.edges = []

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(pipeline))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pipelineGeneratorPlugin()],
})
