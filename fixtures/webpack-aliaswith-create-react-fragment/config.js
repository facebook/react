module.exports = {
  entry: './input',
  output: {
    filename: 'output.js',
  },
  resolve: {
    root: '../../build/packages',
    alias: {
      'react': 'react/dist/react-with-addons',
      'react-dom': 'react-dom/dist/react-dom',
      'create-react-fragment':
      'react-addons-create-fragment/react-addons-create-fragment'
    },
  },
};
