var path = require('path');

module.exports = {
  entry: './input',
  output: {
    filename: 'output.js',
  },
  resolve: {
    root: path.resolve('../../../../build/rollup/packages'),
    alias: {
      'react': 'react/react.umd-dev',
      'react-dom': 'react-dom/react-dom.umd-dev',
    },
  },
};
