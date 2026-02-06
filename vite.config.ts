import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { spawn, execSync } from 'child_process'
import { existsSync, statSync, writeFileSync, unlinkSync, realpathSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// claude CLI 경로 찾기 + 실제 스크립트 경로 resolve (node-pty용)
let CLAUDE_PATH = 'claude'
let CLAUDE_SCRIPT = '' // node-pty에서 사용할 실제 .js 파일 경로
try {
  CLAUDE_PATH = execSync('which claude', { encoding: 'utf-8' }).trim()
  CLAUDE_SCRIPT = realpathSync(CLAUDE_PATH)
} catch {
  const commonPaths = ['/opt/homebrew/bin/claude', '/usr/local/bin/claude', `${process.env.HOME}/.local/bin/claude`]
  for (const p of commonPaths) {
    if (existsSync(p)) {
      CLAUDE_PATH = p
      try { CLAUDE_SCRIPT = realpathSync(p) } catch { CLAUDE_SCRIPT = p }
      break
    }
  }
}
import type { Server } from 'http'
import type { Duplex } from 'stream'
import { WebSocketServer, type WebSocket } from 'ws'

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

function runClaudeCLI(prompt: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`)
    writeFileSync(tmpFile, prompt, 'utf-8')

    const child = spawn('sh', ['-c', `cat "${tmpFile}" | claude -p`], {
      cwd: cwd || process.cwd(),
      timeout: 120000,
      env: { ...process.env, LANG: 'en_US.UTF-8' },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

    child.on('error', (err: Error) => {
      try { unlinkSync(tmpFile) } catch {}
      reject(new Error(`claude CLI 실행 실패: ${err.message}. claude가 설치되어 있는지 확인하세요.`))
    })

    child.on('close', (code: number | null) => {
      try { unlinkSync(tmpFile) } catch {}
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`claude CLI 오류 (code ${code}): ${stderr || stdout}`))
      }
    })
  })
}

function pipelineGeneratorPlugin() {
  return {
    name: 'pipeline-generator-api',
    configureServer(server: {
      middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void }
      httpServer: Server | null
    }) {
      // Interactive terminal WebSocket (node-pty + xterm.js)
      const wss = new WebSocketServer({ noServer: true })

      server.httpServer?.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        if (request.url === '/ws/terminal') {
          wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            wss.emit('connection', ws, request)
          })
        }
      })

      wss.on('connection', (ws: WebSocket) => {
        let ptyProcess: ReturnType<typeof import('node-pty').spawn> | null = null

        ws.on('message', async (raw: Buffer) => {
          try {
            const msg = JSON.parse(raw.toString()) as {
              type: 'start' | 'input' | 'resize'
              projectDir?: string
              prompt?: string
              data?: string
              cols?: number
              rows?: number
            }

            if (msg.type === 'start') {
              const nodePty = await import('node-pty-prebuilt-multiarch')

              if (!msg.projectDir || !existsSync(msg.projectDir)) {
                ws.send(JSON.stringify({ type: 'error', data: '유효하지 않은 디렉토리입니다.' }))
                return
              }

              const args = msg.prompt ? [msg.prompt] : []
              // claude는 node.js 스크립트이므로 node로 직접 실행 (posix_spawnp 회피)
              const spawnCmd = CLAUDE_SCRIPT.endsWith('.js') ? process.execPath : CLAUDE_PATH
              const spawnArgs = CLAUDE_SCRIPT.endsWith('.js') ? [CLAUDE_SCRIPT, ...args] : args
              ptyProcess = nodePty.spawn(spawnCmd, spawnArgs, {
                name: 'xterm-256color',
                cwd: msg.projectDir,
                env: { ...process.env, LANG: 'en_US.UTF-8' } as Record<string, string>,
                cols: msg.cols || 120,
                rows: msg.rows || 30,
              })

              ptyProcess.onData((data: string) => {
                ws.send(JSON.stringify({ type: 'output', data }))
              })

              ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal: number }) => {
                ws.send(JSON.stringify({ type: 'exit', code: exitCode, signal }))
              })
            }

            if (msg.type === 'input' && ptyProcess) {
              ptyProcess.write(msg.data || '')
            }

            if (msg.type === 'resize' && ptyProcess) {
              ptyProcess.resize(msg.cols || 120, msg.rows || 30)
            }
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', data: err instanceof Error ? err.message : 'Unknown error' }))
          }
        })

        ws.on('close', () => {
          if (ptyProcess) {
            ptyProcess.kill()
            ptyProcess = null
          }
        })
      })

      // 폴더 선택 다이얼로그 (macOS osascript / Linux zenity)
      server.middlewares.use('/api/pick-folder', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }

        const isMac = process.platform === 'darwin'
        const isLinux = process.platform === 'linux'

        let child: ReturnType<typeof spawn>
        if (isMac) {
          child = spawn('osascript', ['-e', 'POSIX path of (choose folder with prompt "프로젝트 폴더를 선택하세요")'])
        } else if (isLinux) {
          child = spawn('zenity', ['--file-selection', '--directory', '--title=프로젝트 폴더 선택'])
        } else {
          // Windows fallback
          child = spawn('powershell', ['-Command', '[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")|Out-Null;$f=New-Object System.Windows.Forms.FolderBrowserDialog;if($f.ShowDialog() -eq "OK"){$f.SelectedPath}'])
        }

        let stdout = ''
        child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })

        child.on('close', (code: number | null) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          if (code === 0 && stdout.trim()) {
            res.end(JSON.stringify({ path: stdout.trim() }))
          } else {
            res.end(JSON.stringify({ path: null, cancelled: true }))
          }
        })

        child.on('error', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ path: null, error: '폴더 선택 다이얼로그를 열 수 없습니다.' }))
        })
      })

      // 파이프라인 실제 실행 엔드포인트 (SSE 스트리밍)
      server.middlewares.use('/api/execute-pipeline', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { prompt, projectDir } = JSON.parse(body) as { prompt: string; projectDir: string }

            if (!projectDir || !existsSync(projectDir) || !statSync(projectDir).isDirectory()) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: '유효하지 않은 디렉토리입니다: ' + projectDir }))
              return
            }

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            })

            const send = (type: string, text: string) => {
              res.write(`data: ${JSON.stringify({ type, text })}\n\n`)
            }

            send('status', `프로젝트: ${projectDir}`)
            send('status', 'Claude Code 실행 중...\n')

            const tmpFile = join(tmpdir(), `claude-exec-${Date.now()}.txt`)
            writeFileSync(tmpFile, prompt, 'utf-8')

            const child = spawn('sh', ['-c', `cat "${tmpFile}" | claude -p`], {
              cwd: projectDir,
              timeout: 300000,
              env: { ...process.env, LANG: 'en_US.UTF-8' },
            })

            child.stdout.on('data', (data: Buffer) => send('stdout', data.toString()))
            child.stderr.on('data', (data: Buffer) => send('stderr', data.toString()))

            child.on('close', (code: number | null) => {
              try { unlinkSync(tmpFile) } catch {}
              res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`)
              res.end()
            })

            child.on('error', (err: Error) => {
              try { unlinkSync(tmpFile) } catch {}
              send('error', `claude CLI 실행 실패: ${err.message}`)
              res.end()
            })

            // 클라이언트 연결 끊김 감지 (res.on('close') 사용 - req.on('close')는 body 수신 후 즉시 발생)
            res.on('close', () => {
              if (!child.killed) child.kill('SIGTERM')
              try { unlinkSync(tmpFile) } catch {}
            })
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }))
          }
        })
      })

      // 파이프라인 생성 엔드포인트
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

            const prompt = `당신은 Claude Code 서브에이전트 파이프라인 설계 전문가입니다.
사용자의 작업 설명을 분석하여 최적의 에이전트 파이프라인을 설계합니다.

## 사용 가능한 에이전트
- ${AVAILABLE_AGENTS}

## 규칙
1. 각 에이전트의 prompt는 해당 작업에 맞게 **구체적이고 상세하게** 작성하세요.
2. 같은 단계(step)의 에이전트들은 병렬로 실행됩니다 - edges에서 동일 소스에서 연결.
3. 비용 효율: 간단한 작업은 haiku, 복잡한 작업은 opus.
4. 최소한의 에이전트로 최대 효과.
5. prompt는 그 에이전트가 정확히 무엇을 해야 하는지 구체적으로.

## 응답 형식 (반드시 JSON만 출력, 다른 텍스트 없이)
{
  "id": "generated",
  "name": "파이프라인 이름",
  "description": "설명",
  "nodes": [
    { "agentType": "에이전트ID", "prompt": "구체적 지시" }
  ],
  "edges": [[소스인덱스, 타겟인덱스], ...]
}

다음 작업에 최적의 에이전트 파이프라인을 설계해주세요:

${description}`

            const output = await runClaudeCLI(prompt)

            const jsonMatch = output.match(/\{[\s\S]*\}/)
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
