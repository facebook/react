var path = require('path');

module.exports = {
  entry: './input',
  output: {
    filename: 'output.js',
  },
  resolve: {
    root: path.resolve('../../../../build/packages'),
    alias: {
      'react': 'react/dist/react.dev',
      'react-dom': 'react-dom/dist/react-dom.dev',
    },
  },
};
