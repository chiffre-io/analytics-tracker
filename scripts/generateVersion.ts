import fs from 'fs'
import path from 'path'

export function generateVersion() {
  const version = process.env.RELEASE_VERSION || '0.0.0'
  const gitSha1 = (process.env.GITHUB_SHA || 'local').slice(0, 8)
  const tag = `${version}-${gitSha1}`
  const body = `export const version = '${tag}'`
  const filePath = path.resolve(__dirname, '../src/version.ts')
  fs.writeFileSync(filePath, body)
}

if (require.main === module) {
  generateVersion()
}
