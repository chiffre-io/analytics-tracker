import path from 'path'
import chalk from 'chalk'

const json = require(path.resolve(__dirname, '../dist/build.json'))

const out = json.outputs['dist/analytics.js']

interface Chunk {
  path: string
  filename: string
  size: number
}

const chunks: Chunk[] = Object.keys(out.inputs)
  .sort((a, b) => out.inputs[b].bytesInOutput - out.inputs[a].bytesInOutput)
  .reduce<Chunk[]>(
    (arr, key) => [
      ...arr,
      {
        path: key,
        filename: path.basename(key),
        size: out.inputs[key].bytesInOutput
      }
    ],
    []
  )

const sizePad = Math.max('size'.length, chunks[0].size.toFixed().length)
const filenamePad =
  chunks.reduce((max, chunk) => Math.max(max, chunk.filename.length), 0) + 2

console.info(`${'size'.padStart(sizePad)} ${'file'.padStart(filenamePad)} path`)
chunks.forEach(chunk => {
  const sizeColor =
    chunk.size > 10000
      ? chalk.redBright
      : chunk.size > 1000
      ? chalk.yellowBright
      : chalk.greenBright
  const fileColor = chunk.path.startsWith('node_modules')
    ? chalk.cyan.dim
    : chalk.blueBright
  const pathColor = chunk.path.startsWith('node_modules')
    ? chalk.dim
    : chalk.reset

  console.info(
    `${sizeColor(chunk.size.toFixed().padStart(sizePad))} ${fileColor(
      chunk.filename.padStart(filenamePad)
    )} ${pathColor(chunk.path)}`
  )
})
