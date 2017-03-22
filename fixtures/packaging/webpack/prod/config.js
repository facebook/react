var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './input',
  output: {
    filename: 'output.js',
  },
  resolve: {
    root: path.resolve('../../../../build/rollup/packages/'),
  },
  plugins: [  
    new webpack.DefinePlugin({  
        'process.env':{  
            'NODE_ENV': JSON.stringify('production')
        }
    })
  ]
};
