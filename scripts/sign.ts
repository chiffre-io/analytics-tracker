import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { b64, utf8 } from '@47ng/codec'
import { parseSecretKey, signUtf8String } from '@chiffre/crypto-sign'

function hashFile(filePath: string) {
  const contents = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha256')
  hash.update(contents)
  return `sha256:${b64.encode(hash.digest())}`
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
  const signature = signUtf8String(json, sk)
  return `/*chiffre:sig ${signature}*/\n/*chiffre:header ${json}*/\n`
}

export function run() {
  const filePath = path.resolve(__dirname, '../dist/analytics.js')
  const contents = utf8.decode(fs.readFileSync(filePath))
  if (contents.startsWith('/*chiffre:sig ')) {
    return // Already signed
  }
  const meta: Metadata = {
    version: process.env.RELEASE_VERSION || '0.0.0',
    gitSha1: process.env.GITHUB_SHA || 'local',
    buildUrl: `https://github.com/chiffre-io/analytics-tracker/runs/${process.env.GITHUB_RUN_ID}`
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
