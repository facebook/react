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
      'create-react-class': 'create-react-class/create-react-class',
      'linked-state-mixin':
      'react-addons-linked-state-mixin/react-addons-linked-state-mixin',
      'linked-input':
      'react-linked-input/react-linked-input',
    },
  },
};
