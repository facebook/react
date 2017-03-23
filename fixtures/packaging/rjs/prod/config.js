module.exports = {
  baseUrl: '.',
  name: 'input',
  out: 'output.js',
  optimize: 'none',
  paths: {
    react: '../../../../build/rollup/dist/react.prod.min',
    'react-dom': '../../../../build/rollup/dist/react-dom.prod.min',
  },
};
