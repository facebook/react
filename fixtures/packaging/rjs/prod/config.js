module.exports = {
  baseUrl: '.',
  name: 'input',
  out: 'output.js',
  optimize: 'none',
  paths: {
    react: '../../../../build/node_modules/react/umd/react.production.min',
    'react-dom':
      '../../../../build/node_modules/react-dom/umd/react-dom.production.min',
    schedule:
      '../../../../build/node_modules/scheduler/umd/schedule.development',
  },
};
