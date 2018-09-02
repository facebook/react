'use strict';

const {rollup} = require('rollup');
const {transform} = require('babel-core');

const fakeInput = '__treeshake_module_input__.js';
const fakeCode = '__treeshake_module_code__.js';

const resolvePlugin = ({inputCode}) => ({
  resolveId(importee) {
    if (importee === fakeInput) {
      return importee;
    }
    if (importee === fakeCode) {
      return fakeCode;
    }
  },

  load(id) {
    if (id === fakeInput) {
      return `import {} from "${fakeCode}";`;
    }
    if (id === fakeCode) {
      return inputCode;
    }
    return null;
  },
});

function treeshakeCode(inputCode) {
  const config = {
    input: fakeInput,
    onwarn() {},
    external: id =>
      !id.startsWith('.') &&
      !id.startsWith('/') &&
      id !== fakeInput &&
      id !== fakeCode,
    plugins: [resolvePlugin({inputCode})],
  };

  return rollup(config)
    .then(bundle => bundle.generate({format: 'esm'}))
    .then(result =>
      transform(result.code, {compact: true, minified: true, comments: false})
    )
    .then(result => ({
      originalSize: inputCode.length,
      treeshakedSize: result.code.length,
    }));
}

module.exports = {
  treeshakeCode,
};
