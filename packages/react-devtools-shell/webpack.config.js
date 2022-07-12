const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const fs = require('fs');
const {
  DARK_MODE_DIMMED_WARNING_COLOR,
  DARK_MODE_DIMMED_ERROR_COLOR,
  DARK_MODE_DIMMED_LOG_COLOR,
  LIGHT_MODE_DIMMED_WARNING_COLOR,
  LIGHT_MODE_DIMMED_ERROR_COLOR,
  LIGHT_MODE_DIMMED_LOG_COLOR,
  GITHUB_URL,
  getVersionString,
} = require('react-devtools-extensions/utils');
const {resolveFeatureFlags} = require('react-devtools-shared/buildUtils');
const semver = require('semver');

const ReactVersionSrc = fs.readFileSync(require.resolve('shared/ReactVersion'));
const currentReactVersion = /export default '([^']+)';/.exec(
  ReactVersionSrc,
)[1];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const TARGET = process.env.TARGET;
if (!TARGET) {
  console.error('TARGET not set');
  process.exit(1);
}

const EDITOR_URL = process.env.EDITOR_URL || null;

const builtModulesDir = resolve(
  __dirname,
  '..',
  '..',
  'build',
  'oss-experimental',
);

const __DEV__ = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString();

// If the React version isn't set, we will use the
// current React version instead. Likewise if the
// React version isnt' set, we'll use the build folder
// for both React DevTools and React
const REACT_VERSION = process.env.REACT_VERSION
  ? semver.coerce(process.env.REACT_VERSION).version
  : currentReactVersion;

const E2E_APP_BUILD_DIR = process.env.REACT_VERSION
  ? resolve(__dirname, '..', '..', 'build-regression', 'node_modules')
  : builtModulesDir;

const makeConfig = (entry, alias) => {
  const config = {
    mode: __DEV__ ? 'development' : 'production',
    devtool: __DEV__ ? 'cheap-source-map' : 'source-map',
    entry,
    node: {
      // source-maps package has a dependency on 'fs'
      // but this build won't trigger that code path
      fs: 'empty',
    },
    resolve: {
      alias,
    },
    optimization: {
      minimize: false,
    },
    plugins: [
      new DefinePlugin({
        __DEV__,
        __EXPERIMENTAL__: true,
        __EXTENSION__: false,
        __PROFILE__: false,
        __TEST__: NODE_ENV === 'test',
        'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
        'process.env.EDITOR_URL': EDITOR_URL != null ? `"${EDITOR_URL}"` : null,
        'process.env.DEVTOOLS_PACKAGE': `"react-devtools-shell"`,
        'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
        'process.env.DARK_MODE_DIMMED_WARNING_COLOR': `"${DARK_MODE_DIMMED_WARNING_COLOR}"`,
        'process.env.DARK_MODE_DIMMED_ERROR_COLOR': `"${DARK_MODE_DIMMED_ERROR_COLOR}"`,
        'process.env.DARK_MODE_DIMMED_LOG_COLOR': `"${DARK_MODE_DIMMED_LOG_COLOR}"`,
        'process.env.LIGHT_MODE_DIMMED_WARNING_COLOR': `"${LIGHT_MODE_DIMMED_WARNING_COLOR}"`,
        'process.env.LIGHT_MODE_DIMMED_ERROR_COLOR': `"${LIGHT_MODE_DIMMED_ERROR_COLOR}"`,
        'process.env.LIGHT_MODE_DIMMED_LOG_COLOR': `"${LIGHT_MODE_DIMMED_LOG_COLOR}"`,
        'process.env.E2E_APP_REACT_VERSION': `"${REACT_VERSION}"`,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: {
            configFile: resolve(
              __dirname,
              '..',
              'react-devtools-shared',
              'babel.config.js',
            ),
          },
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                modules: true,
                localIdentName: '[local]',
              },
            },
          ],
        },
      ],
    },
  };

  if (TARGET === 'local') {
    // Local dev server build.
    config.devServer = {
      hot: true,
      port: 8080,
      clientLogLevel: 'warning',
      publicPath: '/dist/',
      stats: 'errors-only',
    };
  } else {
    // Static build to deploy somewhere else.
    config.output = {
      path: resolve(__dirname, 'dist'),
      filename: '[name].js',
    };
  }
  return config;
};

const app = makeConfig(
  {
    'app-index': './src/app/index.js',
    'app-devtools': './src/app/devtools.js',
    'e2e-app': './src/e2e/app.js',
    'e2e-devtools': './src/e2e/devtools.js',
    'e2e-devtools-regression': './src/e2e-regression/devtools.js',
    'multi-left': './src/multi/left.js',
    'multi-devtools': './src/multi/devtools.js',
    'multi-right': './src/multi/right.js',
    'e2e-regression': './src/e2e-regression/app.js',
  },
  {
    react: resolve(builtModulesDir, 'react'),
    'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
    'react-devtools-feature-flags': resolveFeatureFlags('shell'),
    'react-dom/client': resolve(builtModulesDir, 'react-dom/client'),
    'react-dom': resolve(builtModulesDir, 'react-dom/unstable_testing'),
    'react-is': resolve(builtModulesDir, 'react-is'),
    scheduler: resolve(builtModulesDir, 'scheduler'),
  },
);

// Prior to React 18, we use ReactDOM.render rather than
// createRoot.
// We also use a separate build folder to build the React App
// so that we can test the current DevTools against older version of React
const e2eRegressionApp = semver.lt(REACT_VERSION, '18.0.0')
  ? makeConfig(
      {
        'e2e-app-regression': './src/e2e-regression/app-legacy.js',
      },
      {
        react: resolve(E2E_APP_BUILD_DIR, 'react'),
        'react-dom': resolve(E2E_APP_BUILD_DIR, 'react-dom'),
        ...(semver.satisfies(REACT_VERSION, '16.5')
          ? {schedule: resolve(E2E_APP_BUILD_DIR, 'schedule')}
          : {scheduler: resolve(E2E_APP_BUILD_DIR, 'scheduler')}),
      },
    )
  : makeConfig(
      {
        'e2e-app-regression': './src/e2e-regression/app.js',
      },
      {
        react: resolve(E2E_APP_BUILD_DIR, 'react'),
        'react-dom': resolve(E2E_APP_BUILD_DIR, 'react-dom'),
        'react-dom/client': resolve(E2E_APP_BUILD_DIR, 'react-dom/client'),
        scheduler: resolve(E2E_APP_BUILD_DIR, 'scheduler'),
      },
    );

module.exports = [app, e2eRegressionApp];
