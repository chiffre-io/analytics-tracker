const fs = require('fs')
const path = require('path')
const readPkg = require('read-pkg')

function readSha1(libDir) {
  try {
    return fs
      .readFileSync(path.resolve(libDir, 'git-sha1.txt'))
      .toString('utf-8')
      .trim()
  } catch {
    return null
  }
}

readPkg().then(pkg => {
  const libDir = path.resolve(__dirname, '../lib')
  const gitSha1 = readSha1(libDir)
  const version = pkg.version + (gitSha1 ? '-' + gitSha1 : '')
  const ts = `export declare const version = "${version}";`
  const js = `"use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.version = void 0;
  exports.version = '${version}';
`
  fs.writeFileSync(path.resolve(libDir, 'version.js'), js)
  fs.writeFileSync(path.resolve(libDir, 'version.d.ts'), ts)
})
