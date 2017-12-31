/* @flow */

const SourceMapConsumer = require('source-map').SourceMapConsumer

const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/

export function createSourceMapConsumers (rawMaps: Object) {
  const maps = {}
  Object.keys(rawMaps).forEach(file => {
    maps[file] = new SourceMapConsumer(rawMaps[file])
  })
  return maps
}

export function rewriteErrorTrace (e: any, mapConsumers: {
  [key: string]: SourceMapConsumer
}) {
  if (e && typeof e.stack === 'string') {
    e.stack = e.stack.split('\n').map(line => {
      return rewriteTraceLine(line, mapConsumers)
    }).join('\n')
  }
}

function rewriteTraceLine (trace: string, mapConsumers: {
  [key: string]: SourceMapConsumer
}) {
  const m = trace.match(filenameRE)
  const map = m && mapConsumers[m[1]]
  if (m != null && map) {
    const originalPosition = map.originalPositionFor({
      line: Number(m[2]),
      column: Number(m[3])
    })
    if (originalPosition.source != null) {
      const { source, line, column } = originalPosition
      const mappedPosition = `(${source.replace(/^webpack:\/\/\//, '')}:${String(line)}:${String(column)})`
      return trace.replace(filenameRE, mappedPosition)
    } else {
      return trace
    }
  } else {
    return trace
  }
}
