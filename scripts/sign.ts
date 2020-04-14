import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { b64, utf8 } from '@47ng/codec'
import { parseSecretKey, signUtf8String } from '@chiffre/crypto-sign'

function sha256(text: string | Buffer) {
  const hash = crypto.createHash('sha256')
  hash.update(text)
  return `sha256:${b64.encode(hash.digest())}`
}

function hashFile(filePath: string) {
  const contents = fs.readFileSync(filePath)
  return sha256(contents)
}

export interface Metadata {
  version: string
  gitSha1: string
  buildUrl: string
}

export interface Header extends Metadata {
  fileHash: string
}

export function generateHeader(
  meta: Metadata,
  secretKey: string,
  filePath: string
) {
  const sk = parseSecretKey(secretKey)
  const hash = hashFile(filePath)
  const header: Header = {
    ...meta,
    fileHash: hash
  }
  const json = JSON.stringify(header)
  const jsonHash = sha256(json)
  const signature = signUtf8String(jsonHash, sk)
  return `/*chiffre:sig ${signature}*/\n/*chiffre:header ${json}*/\n`
}

export function run() {
  const filePath = path.resolve(__dirname, '../dist/analytics.js')
  const contents = utf8.decode(fs.readFileSync(filePath))
  if (contents.startsWith('/*chiffre:sig ')) {
    return // Already signed
  }
  const meta: Metadata = {
    version: process.env.npm_package_version || '0.0.0-local',
    gitSha1: process.env.GITHUB_SHA || 'local',
    buildUrl: `https://github.com/chiffre-io/analytics-tracker/actions/runs/${process.env.GITHUB_RUN_ID}`
  }
  const secretKey = process.env.SIGNATURE_SECRET_KEY
  if (!secretKey) {
    console.error('Missing signature secret key (env: SIGNATURE_SECRET_KEY)')
  }
  const header = generateHeader(meta, secretKey!, filePath)
  fs.writeFileSync(filePath, header + contents)
}

if (require.main === module) {
  run()
}
