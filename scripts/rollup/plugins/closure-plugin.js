'use strict';

const ClosureCompiler = require('google-closure-compiler').compiler;
const {promisify} = require('util');
const fs = require('fs');
const tmp = require('tmp');
const writeFileAsync = promisify(fs.writeFile);

function compile(flags) {
  return new Promise((resolve, reject) => {
    const closureCompiler = new ClosureCompiler(flags);
    closureCompiler.run(function (exitCode, stdOut, stdErr) {
      if (!stdErr) {
        resolve(stdOut);
      } else {
        reject(new Error(stdErr));
      }
    });
  });
}

module.exports = function closure(flags = {}, {needsSourcemaps}) {
  return {
    name: 'scripts/rollup/plugins/closure-plugin',
    async renderChunk(code, chunk, options) {
      const inputFile = tmp.fileSync();

      // Use a path like `node_modules/react/cjs/react.production.min.js.map` for the sourcemap file
      const sourcemapPath = options.file.replace('.js', '.js.map');

      // Tell Closure what JS source file to read, and optionally what sourcemap file to write
      const finalFlags = {
        ...flags,
        js: inputFile.name,
        ...(needsSourcemaps && {create_source_map: sourcemapPath}),
      };

      await writeFileAsync(inputFile.name, code, 'utf8');
      const compiledCode = await compile(finalFlags);

      inputFile.removeCallback();
      return {code: compiledCode};
    },
  };
};
