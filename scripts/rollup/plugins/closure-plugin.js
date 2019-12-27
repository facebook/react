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

module.exports = function closure(flags = {}) {
  return {
    name: 'scripts/rollup/plugins/closure-plugin',
    async transformBundle(code) {
      const inputFile = tmp.fileSync();
      const tempPath = inputFile.name;
      flags = Object.assign({}, flags, {js: tempPath});
      await writeFileAsync(tempPath, code, 'utf8');
      const compiledCode = await compile(flags);
      inputFile.removeCallback();
      return {code: compiledCode};
    },
  };
};
