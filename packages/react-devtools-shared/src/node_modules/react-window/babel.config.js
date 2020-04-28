module.exports = {
  presets: [['@babel/env', { loose: true }], '@babel/flow'],
  plugins: [
    ['@babel/proposal-class-properties', { loose: true }],
    'annotate-pure-calls',
  ],
};
