import path from 'path'
import { build, BuildOptions } from 'esbuild'

const options: BuildOptions = {
  entryPoints: [path.resolve(__dirname, '../src/main.ts')],
  outfile: path.resolve(__dirname, '../dist/analytics.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  external: ['crypto'],
  logLevel: 'info',
  metafile: path.resolve(__dirname, '../dist/build.json'),
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}

build(options).catch(() => process.exit(1))
