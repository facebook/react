module.exports = api => {
  const isTest = api.env('test');

  const plugins = [
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-proposal-class-properties', {loose: false}],

    // The plugins below fix compilation errors on Webpack 4.
    // See: https://github.com/webpack/webpack/issues/10227
    // TODO: Remove once we're on Webpack 5.
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
  ];
  if (process.env.NODE_ENV !== 'production') {
    plugins.push(['@babel/plugin-transform-react-jsx-source']);
  }

  return {
    plugins,
    presets: [
      [
        '@babel/preset-env',
        {
          targets: isTest
            ? {node: 'current'}
            : 'last 2 Chrome versions, last 2 Firefox versions',
        },
      ],
      '@babel/preset-react',
      '@babel/preset-flow',
    ],
  };
};
