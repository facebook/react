/* @flow */

/**
 * Creates a mapper that maps components used during a server-side render
 * to async chunk files in the client-side build, so that we can inline them
 * directly in the rendered HTML to avoid waterfall requests.
 */

import type { ClientManifest } from './index'

export type AsyncFileMapper = (files: Array<string>) => Array<string>;

export function createMapper (
  clientManifest: ClientManifest
): AsyncFileMapper {
  const map = createMap(clientManifest)
  // map server-side moduleIds to client-side files
  return function mapper (moduleIds: Array<string>): Array<string> {
    const res = new Set()
    for (let i = 0; i < moduleIds.length; i++) {
      const mapped = map.get(moduleIds[i])
      if (mapped) {
        for (let j = 0; j < mapped.length; j++) {
          res.add(mapped[j])
        }
      }
    }
    return Array.from(res)
  }
}

function createMap (clientManifest) {
  const map = new Map()
  Object.keys(clientManifest.modules).forEach(id => {
    map.set(id, mapIdToFile(id, clientManifest))
  })
  return map
}

function mapIdToFile (id, clientManifest) {
  const files = []
  const fileIndices = clientManifest.modules[id]
  if (fileIndices) {
    fileIndices.forEach(index => {
      const file = clientManifest.all[index]
      // only include async files or non-js assets
      if (clientManifest.async.indexOf(file) > -1 || !(/\.js($|\?)/.test(file))) {
        files.push(file)
      }
    })
  }
  return files
}
