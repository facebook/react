const {fork} = require('child_process');
// import logger from './logger';

function compile(flags) {
  return new Promise((resolve, reject) => {
    const child = fork(require.resolve('./closure-compiler.js'));
    const command = { status: 'START', data: flags };
    child.on('message', ({status, data}) => {
      if (status === 'SUCCESS') {
        child.kill('SIGINT');
        resolve(data);
      }
    });
    child.send(command);
  });
}

module.exports = function closure(flags = {}) {
  return {
    name: 'closure-compiler-js',
    async transformBundle(code) {
      flags = Object.assign({
        createSourceMap: true,
        processCommonJsModules: true,
      }, flags);
      flags.jsCode = [{
          src: code,
      }];

      const output = await compile(flags);
      // if (logger(flags, output)) {
      //     throw new Error(`compilation error, ${output.errors.length} error${output.errors.length===0 || output.errors.length>1?'s':''}`);
      // }
      return {code: output.compiledCode, map: output.sourceMap};
    },
  };
};
