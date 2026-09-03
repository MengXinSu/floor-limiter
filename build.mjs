/**
 * floor-limiter build: host ESM (lib/index.js) + client browser CJS
 * (lib/client.js, wrapped in the ModuleLoader factory handshake the web
 * server serves per plugin). @deepseek-ai/dsh-* and react stay external —
 * the profile's node_modules and the app's module system provide them.
 * schemastery is bundled for the host half because the Loader validates
 * Config against the schema in-process.
 *
 * esbuild resolves the portable way: a standard `import 'esbuild'` first,
 * then a walk up the enclosing node_modules chain (pnpm store layouts where
 * a hoisted .pnpm copy exists but no top-level entry). No machine-specific
 * paths — the build works from the repo root after `npm install`.
 */
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

async function resolveEsbuild() {
  // Standard resolution (repo-local devDependency).
  try {
    return (await import('esbuild')).build
  } catch {
    // pnpm layouts: walk up from this file looking for node_modules/esbuild.
  }
  const require = createRequire(import.meta.url)
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    const candidate = join(dir, 'node_modules', 'esbuild', 'lib', 'main.js')
    try {
      return require(candidate).build
    } catch {
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  throw new Error('esbuild not found — run `npm install` in the repo root first')
}

const build = await resolveEsbuild()

mkdirSync('lib', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  external: dshExternal,
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  jsx: 'automatic',
  external: [...dshExternal, 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  banner: {
    js: "window.__ModuleLoader__.load({ id: 'floor-limiter', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})
