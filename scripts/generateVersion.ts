import fs from 'fs'
import path from 'path'
import getSemverTags from 'git-semver-tags'

export async function getLatestTag() {
  return new Promise<string>((resolve, reject) =>
    getSemverTags((error, tags) => {
      if (error) {
        return reject(error)
      }
      resolve(tags[0].replace(/^v/, ''))
    })
  )
}

async function generateVersion() {
  const version = await getLatestTag()
  const gitSha1 = (process.env.GITHUB_SHA || 'local').slice(0, 8)
  const tag = `${version}-${gitSha1}`
  const body = `export const version = '${tag}'`
  const filePath = path.resolve(__dirname, '../src/version.ts')
  fs.writeFileSync(filePath, body)
}

if (require.main === module) {
  generateVersion()
}
