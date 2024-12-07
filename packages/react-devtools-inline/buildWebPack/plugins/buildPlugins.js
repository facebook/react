import {
    GITHUB_URL,
  } from 'react-devtools-extensions/utils';

export function buildPlugins() {

    const plugins = [
        new Webpack.DefinePlugin({
            __DEV__: env.__DEV__,
            __EXPERIMENTAL__: true,
            __EXTENSION__: false,
            __PROFILE__: false,
            __TEST__: env.NODE_ENV === 'test',
            __IS_CHROME__: false,
            __IS_FIREFOX__: false,
            __IS_EDGE__: false,
            __IS_NATIVE__: false,
            'process.env.DEVTOOLS_PACKAGE': `"react-devtools-inline"`,
            'process.env.DEVTOOLS_VERSION': `"${env.DEVTOOLS_VERSION}"`,
            'process.env.EDITOR_URL': env.EDITOR_URL != null ? `"${env.EDITOR_URL}"` : null,
            'process.env.GITHUB_URL': `"${env.GITHUB_URL}"`,
            'process.env.NODE_ENV': `"${env.NODE_ENV}"`,
          }),

          new Webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
          }),
    ]

    return plugins
}