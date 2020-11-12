import fs from 'fs'
import path from 'path'
import { verifySignature, parsePublicKey } from '@chiffre/crypto-sign'
import { sha256 } from './sign'

const SIGNATURE_HEADER_REGEX = /^\/\*chiffre:sig (.*)\*\/$/
const METADATA_HEADER_REGEX = /^\/\*chiffre:header (.*)\*\/$/

function extractPublicKeys() {
  return process.env.SIGNATURE_PUBLIC_KEYS!.split(',').map(parsePublicKey)
}

function tryVerifyingSignature(sig: string, keys: Uint8Array[]) {
  for (const key of keys) {
    try {
      return verifySignature(sig, key)
    } catch {}
  }
  throw new Error('None of the provided public keys could verify the signature')
}

function readFile(filePath: string) {
  const publicKeys = extractPublicKeys()
  const text = fs.readFileSync(filePath).toString('utf-8')
  const lines = text.split('\n').filter(line => line.length > 0)
  const sigMatch = lines[0].match(SIGNATURE_HEADER_REGEX)
  const metaMatch = lines[1].match(METADATA_HEADER_REGEX)
  const json = metaMatch![1]
  const jsonHash = sha256(json)
  const hash = tryVerifyingSignature(sigMatch![1], publicKeys)
  const fileHash = sha256(lines[2] + '\n')
  const meta = JSON.parse(json)
  const verified = jsonHash === hash && fileHash === meta.fileHash
  console.dir({
    verified,
    meta
  })
  return meta
}

function main() {
  const currentBundlePath = path.resolve(__dirname, '../dist/analytics.js')
  const meta = readFile(currentBundlePath)
  const archiveBundlePath = currentBundlePath.replace(
    /\.js$/,
    `-${meta.version}-${meta.gitSha1.slice(0, 8)}.js`
  )
  fs.copyFileSync(currentBundlePath, archiveBundlePath)
}

// --

if (require.main === module) {
  main()
}
