'use strict';

/**
 * Traverses the module graph and collects assets for a given chunk
 *
 * @param manifest Client manifest
 * @param id Chunk id
 * @param assetMap Cache of assets
 * @returns Array of asset URLs
 */
const findAssetsInManifest = (manifest, id, assetMap = new Map()) => {
  function traverse(id) {
    const cached = assetMap.get(id);
    if (cached) {
      return cached;
    }
    const chunk = manifest[id];
    if (!chunk) {
      return [];
    }
    const assets = [
      ...(chunk.assets || []),
      ...(chunk.css || []),
      ...(chunk.imports?.flatMap(traverse) || []),
    ];
    const imports = chunk.imports?.flatMap(traverse) || [];
    const all = [...assets, ...imports].filter(Boolean);
    all.push(chunk.file);
    assetMap.set(id, all);
    return Array.from(new Set(all));
  }
  return traverse(id);
};

const findAssetsInModuleNode = moduleNode => {
  const seen = new Set();
  function traverse(node) {
    if (seen.has(node.url)) {
      return [];
    }
    seen.add(node.url);

    const imports = [...node.importedModules].flatMap(traverse) || [];
    imports.push(node.url);
    return Array.from(new Set(imports));
  }
  return traverse(moduleNode);
};

module.exports = {
  findAssetsInManifest,
};
