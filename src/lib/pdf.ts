import { execFile } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isApplicationFolder } from './history'

export const PDF_FILE = 'resume.tailored.pdf'

const TECTONIC = 'tectonic'
const TEX_FILE = 'resume.tailored.tex'
const TIMEOUT = 90000

export type PdfResult =
  | { ok: true; pages: number; log: string[] }
  | { ok: false; error: string; log: string[]; missing?: boolean }

type ExecResult = { stdout: string; stderr: string }
type ExecFailure = ExecResult & { error: Error }

function run(args: string[], cwd: string, timeout: number): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(TECTONIC, args, { cwd, timeout }, (error, stdout, stderr) => {
      const output = { stdout: String(stdout), stderr: String(stderr) }
      if (error) reject({ ...output, error })
      else resolve(output)
    })
  })
}

export function lastLines(text: string): string[] {
  return text.split(/\r?\n/).filter(Boolean).slice(-20)
}

function countPages(path: string): number {
  return (readFileSync(path, 'utf8').match(/\/Type\s*\/Page\b/g) ?? []).length
}

export async function tectonicAvailable(): Promise<boolean> {
  try {
    await run(['--version'], process.cwd(), 5000)
    return true
  } catch {
    return false
  }
}

export async function compileApplicationPdf(folder: string, root = process.cwd()): Promise<PdfResult> {
  if (!isApplicationFolder(folder)) {
    return { ok: false, error: 'Invalid application folder.', log: [] }
  }
  if (!(await tectonicAvailable())) {
    return { ok: false, error: 'Tectonic is not installed.', log: [], missing: true }
  }
  const cwd = join(root, 'private', 'applications', folder)
  try {
    const { stdout, stderr } = await run(['-X', 'compile', TEX_FILE], cwd, TIMEOUT)
    return { ok: true, pages: countPages(join(cwd, PDF_FILE)), log: lastLines(`${stdout}\n${stderr}`) }
  } catch (failure) {
    const error = failure as ExecFailure
    return {
      ok: false,
      error: error.error?.message ?? 'PDF compilation failed.',
      log: lastLines(`${error.stdout ?? ''}\n${error.stderr ?? ''}`),
    }
  }
}

export async function countBasePages(root = process.cwd()): Promise<number | null> {
  const source = join(root, 'private', 'base.tex')
  if (!existsSync(source) || !(await tectonicAvailable())) return null
  const cwd = mkdtempSync(join(tmpdir(), 'resume-tailor-base-'))
  try {
    copyFileSync(source, join(cwd, TEX_FILE))
    await run(['-X', 'compile', TEX_FILE], cwd, TIMEOUT)
    return countPages(join(cwd, PDF_FILE))
  } catch {
    return null
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}
