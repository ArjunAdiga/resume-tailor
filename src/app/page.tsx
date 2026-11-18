import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import TailorApp from '@/components/TailorApp'
import { getMode } from '@/lib/mode'

export default function Home() {
  const root = process.cwd()
  const sampleTex = readFileSync(join(root, 'samples', 'resume.sample.tex'), 'utf8')
  const sampleJd = readFileSync(join(root, 'samples', 'jd.sample.txt'), 'utf8')

  return <TailorApp mode={getMode()} sampleTex={sampleTex} sampleJd={sampleJd} />
}
