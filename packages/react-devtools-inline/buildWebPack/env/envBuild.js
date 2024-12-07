  import {
    getVersionString,
  } from 'react-devtools-extensions/utils';
  

export const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

export const EDITOR_URL = process.env.EDITOR_URL || null;

export const DEVTOOLS_VERSION = getVersionString();

export const mode = __DEV__ ? 'development' : 'production';

export const devtool = __DEV__ ? 'eval-cheap-source-map' : 'source-map';

export const entryPoints = [
  { name: 'backend', path: './src/backend.js' },
  { name: 'frontend', path: './src/frontend.js' },
  { name: 'hookNames', path: './src/hookNames.js' },
];

export const __DEV__ = NODE_ENV === 'development';

export const { path, publicPath, filename, chunkFilename, library } = output;

export const output = {
    path: __dirname + '/dist',
    publicPath: '/dist/',
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    library: {
      type: 'commonjs2',
    },
  };