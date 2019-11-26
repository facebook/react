'use strict';

module.exports = function forbidFBJSImports() {
  return {
    name: 'forbidFBJSImports',
    resolveId(importee, importer) {
      if (/^fbjs\//.test(importee)) {
        throw new Error(
          `Don't import ${importee} (found in ${importer}). ` +
            `Use the utilities in packages/shared/ instead.`
        );
      }
    },
  };
};
