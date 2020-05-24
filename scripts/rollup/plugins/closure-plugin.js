'use strict';

const ClosureCompiler = require('google-closure-compiler').compiler;
const {promisify} = require('util');
const fs = require('fs');
const tmp = require('tmp');
const writeFileAsync = promisify(fs.writeFile);

function compile(flags) {
  return new Promise((resolve, reject) => {
    const closureCompiler = new ClosureCompiler(flags);
    closureCompiler.run(function(exitCode, stdOut, stdErr) {
      if (!stdErr) {
        resolve(stdOut);
      } else {
        reject(new Error(stdErr));
      }
    });
  });
}

function encodeNativeCalls(code) {
  // Closure Compiler tries to install a polyfill if we reference the Symbol global.
  // We need to temporarily trick Closure that it's not the built-in it's looking for.
  return code.replace(/Symbol/g, 'SymbolTmp');
}

function decodeNativeCalls(code) {
  return code.replace(/SymbolTmp/g, 'Symbol');
}

module.exports = function closure(flags = {}) {
  return {
    name: 'scripts/rollup/plugins/closure-plugin',
    async renderChunk(code) {
      const inputFile = tmp.fileSync();
      const tempPath = inputFile.name;
      flags = Object.assign({}, flags, {js: tempPath});
      const filteredCode = encodeNativeCalls(code);
      await writeFileAsync(tempPath, filteredCode, 'utf8');
      const compiledCode = await compile(flags);
      inputFile.removeCallback();
      const decodedCode = decodeNativeCalls(compiledCode);
      return {code: decodedCode};
    },
  };
};
