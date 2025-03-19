/** @type {import('jest').Config} */
const config = {
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {configFile: require.resolve('./babel.config.js')},
    ],
  },
};

module.exports = config;
