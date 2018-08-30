module.exports = {
  baseUrl: '.',
  name: 'input',
  out: 'output.js',
  optimize: 'none',
  paths: {
    'interaction-tracking':
      '../../../../build/dist/interaction-tracking.production.min',
    react: '../../../../build/dist/react.production.min',
    'react-dom': '../../../../build/dist/react-dom.production.min',
  },
};
