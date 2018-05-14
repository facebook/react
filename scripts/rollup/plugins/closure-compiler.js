let closureCompiler;

process.on('message', ({status, data}) => {
  if (status === 'START') {
    closureCompiler = require('google-closure-compiler-js');
    const output = closureCompiler.compile(data);
    process.send({
      status: 'SUCCESS',
      data: {code: output.compiledCode, map: output.sourceMap},
    });
  }
});
