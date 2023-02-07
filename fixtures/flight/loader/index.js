import {
  resolve,
  load as reactLoad,
  getSource as getSourceImpl,
  transformSource as reactTransformSource,
} from 'react-server-dom-webpack/node-loader';

export {resolve};

import babel from '@babel/core';

const babelOptions = {
  babelrc: false,
  ignore: [/\/(build|node_modules)\//],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-react-jsx',
  ],
};

async function babelLoad(url, context, defaultLoad) {
  const {format} = context;
  const result = await defaultLoad(url, context, defaultLoad);
  if (result.format === 'module') {
    const opt = Object.assign({filename: url}, babelOptions);
    const {code} = await babel.transformAsync(result.source, opt);
    return {source: code, format: 'module'};
  }
  return defaultLoad(url, context, defaultLoad);
}

export async function load(url, context, defaultLoad) {
  return await reactLoad(url, context, (u, c) => {
    return babelLoad(u, c, defaultLoad);
  });
}

async function babelTransformSource(source, context, defaultTransformSource) {
  const {format} = context;
  if (format === 'module') {
    const opt = Object.assign({filename: context.url}, babelOptions);
    const {code} = await babel.transformAsync(source, opt);
    return {source: code};
  }
  return defaultTransformSource(source, context, defaultTransformSource);
}

async function transformSourceImpl(source, context, defaultTransformSource) {
  return await reactTransformSource(source, context, (s, c) => {
    return babelTransformSource(s, c, defaultTransformSource);
  });
}

export const transformSource =
  process.version < 'v16' ? transformSourceImpl : undefined;
export const getSource = process.version < 'v16' ? getSourceImpl : undefined;
