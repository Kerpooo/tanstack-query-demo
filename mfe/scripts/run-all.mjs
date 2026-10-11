// Ejecuta un script de package.json en todos los paquetes del workspace, con el
// mismo gestor que lo invocó (npm o pnpm). Uso: node scripts/run-all.mjs <script> [--parallel]
// Con --parallel los lanza a la vez (dev); sin él, en orden y se detiene al primer fallo.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [script, ...flags] = process.argv.slice(2)
const parallel = flags.includes('--parallel')
if (!script) {
  console.error('Uso: node scripts/run-all.mjs <script> [--parallel]')
  process.exit(1)
}

const { workspaces } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const pm = (process.env.npm_config_user_agent ?? '').startsWith('pnpm') ? 'pnpm' : 'npm'

function run(pkg) {
  return new Promise((resolve) => {
    const child = spawn(pm, ['run', script], {
      cwd: join(root, pkg),
      shell: process.platform === 'win32',
      env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1' },
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    // Antepone el nombre del paquete a cada línea, como `pnpm --recursive`.
    for (const stream of [child.stdout, child.stderr]) {
      let pending = ''
      stream.on('data', (chunk) => {
        const lines = (pending + chunk).split('\n')
        pending = lines.pop() ?? ''
        for (const line of lines) process.stdout.write(`${pkg} ${script}: ${line}\n`)
      })
      stream.on('end', () => pending && process.stdout.write(`${pkg} ${script}: ${pending}\n`))
    }
    child.on('close', (code) => resolve(code ?? 1))
  })
}

if (parallel) {
  const codes = await Promise.all(workspaces.map(run))
  process.exit(codes.find((code) => code !== 0) ?? 0)
}
for (const pkg of workspaces) {
  const code = await run(pkg)
  if (code !== 0) process.exit(code)
}
