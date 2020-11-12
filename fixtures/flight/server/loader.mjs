import babel from '@babel/core';

const options = {
  babelrc: false,
  ignore: [/\/(build|node_modules)\//],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-react-jsx',
  ],
};

const optionsCommonJS = {
  ignore: [/\/(build|node_modules)\//],
  presets: ['react-app'],
  plugins: ['@babel/transform-modules-commonjs'],
};

export async function transformSource(source, context, defaultTransformSource) {
  const {format} = context;
  if (format === 'module' || format === 'commonjs') {
    const opt = Object.assign(
      {filename: context.url},
      format === 'commonjs' ? optionsCommonJS : options
    );
    const {code} = await babel.transformAsync(source, opt);
    return {source: code};
  }
  return defaultTransformSource(source, context);
}

export async function getSource(url, context, defaultGetSource) {
  if (url.endsWith('.client.js')) {
    const name = url;
    return {
      source:
        "export default { $$typeof: Symbol.for('react.module.reference'), name: " +
        JSON.stringify(name) +
        '}',
    };
  }
  return defaultGetSource(url, context, defaultGetSource);
}
