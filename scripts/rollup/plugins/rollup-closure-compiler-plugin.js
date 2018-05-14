const ClosureCompiler = require('google-closure-compiler').compiler;
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const writeFileAsync = promisify(fs.writeFile);

function compile(flags) {
  return new Promise((resolve, reject) => {    
    const closureCompiler = new ClosureCompiler(flags);
    
    closureCompiler.run(function(exitCode, stdOut, stdErr) {
      // not sure if this is 100% right for error checking,
      // didn't get time to confirm
      if (!stdErr) {
        resolve(stdOut);
      } else {
        reject(stdErr);
      }
    });
  });
}

function deleteFile(filename) {
  return new Promise((resolve, reject) => {
    fs.unlink(filename, err => {
      if (err) {
        reject();
      }
      resolve();
    });
  });
}

module.exports = function closure(flags = {}) {
  return {
    name: 'closure-compiler-js',
    async transformBundle(code) {
      const tempPath = path.resolve(__dirname, 'temp.js');
      flags = Object.assign({}, flags, { js: tempPath });
      await writeFileAsync(tempPath, code, 'utf8');
      const compiledCode = await compile(flags);
      await deleteFile(tempPath);
      return {code: compiledCode };
    },
  };
};
