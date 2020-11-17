import {resolve, getSource} from 'react-transport-dom-webpack/node-loader';

export {resolve, getSource};

import babel from '@babel/core';

const babelOptions = {
  babelrc: false,
  ignore: [/\/(build|node_modules)\//],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-react-jsx',
  ],
};

export async function transformSource(source, context, defaultTransformSource) {
  const {format} = context;
  if (format === 'module') {
    const opt = Object.assign({filename: context.url}, babelOptions);
    const {code} = await babel.transformAsync(source, opt);
    return {source: code};
  }
  return defaultTransformSource(source, context, defaultTransformSource);
}
