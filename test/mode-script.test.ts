import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { colorModeScript } from '../src/index.js'

const useClient = /^\s*['"]use client['"]/m
const DEFAULT =
  `(function(){try{var c=localStorage.getItem("payload-theme");var m=c==='light'||c==='dark'?c:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute("data-theme",m)}catch(e){}})();`
const CUSTOM = DEFAULT.replace('"payload-theme"', '"my-key"').replace('"data-theme"', '"data-mode"')

let out = ''
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'color-theory-build-'))
  execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json', '--outDir', out], { cwd: process.cwd(), stdio: 'pipe' })
}, 120_000)
afterAll(() => rmSync(out, { recursive: true, force: true }))

describe('colorModeScript on the server side', () => {
  it('is exported from a source module and a main entry with no "use client"', () => {
    for (const f of ['src/mode/script.ts', 'src/index.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(useClient)
  })

  it('is in built modules with no "use client" (the main entry, /mode/script and what they import)', () => {
    for (const f of ['index.js', 'mode/script.js']) expect(readFileSync(join(out, f), 'utf8')).not.toMatch(useClient)
    expect(readFileSync(join(out, 'mode/script.d.ts'), 'utf8')).toContain('colorModeScript')
    // The /mode entry is the client one, and still re-exports it for client callers.
    expect(readFileSync(join(out, 'mode/index.js'), 'utf8')).toMatch(useClient)
    expect(readFileSync(join(out, 'mode/index.js'), 'utf8')).toContain('colorModeScript')
  })

  it('declares the server-safe subpath in package.json exports, with types', () => {
    const exp = JSON.parse(readFileSync('package.json', 'utf8')).exports['./mode/script']
    expect(exp).toEqual({ types: './dist/mode/script.d.ts', import: './dist/mode/script.js' })
  })

  it('gives the same script from source and from the build, for defaults and custom options', async () => {
    const built = await import(pathToFileURL(join(out, 'mode/script.js')).href)
    expect(colorModeScript()).toBe(DEFAULT)
    expect(built.colorModeScript()).toBe(DEFAULT)
    const o = { storageKey: 'my-key', attribute: 'data-mode' }
    expect(colorModeScript(o)).toBe(CUSTOM)
    expect(built.colorModeScript(o)).toBe(CUSTOM)
  })
})
