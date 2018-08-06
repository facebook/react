'use strict';

const {rollup} = require('rollup');
const replace = require('rollup-plugin-replace');

const fakeInput = '__treeshake_module_input__.js';

const resolvePlugin = ({input}) => ({
  resolveId(importee) {
    return importee === fakeInput ? importee : null;
  },

  load(id) {
    if (id === fakeInput) {
      return `import {} from "${input}";`;
    }
    return null;
  },
});

function treeshakeProductionModule(input) {
  const config = {
    input: fakeInput,
    onwarn() {},
    external: id =>
      !id.startsWith('.') && !id.startsWith('/') && id !== fakeInput,
    plugins: [
      resolvePlugin({input}),
      replace({'process.env.NODE_ENV': JSON.stringify('production')}),
    ],
  };

  return rollup(config)
    .then(bundle => bundle.generate({format: 'esm'}))
    .then(result => ({size: result.code.length}));
}

module.exports = {
  treeshakeProductionModule,
};
