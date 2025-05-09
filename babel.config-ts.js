/**
 * Babel configuration specifically for Jest testing environment.
 * This file is used only for local Jest runs and doesn't participate in the build process.
 */
'use strict';

module.exports = {
  // Enable caching for faster transforms
  cacheDirectory: '.jest-cache/babel',
  
  // Add comments to generated code to make debugging easier
  comments: true,
  
  plugins: [
    '@babel/plugin-syntax-jsx',
    '@babel/plugin-transform-flow-strip-types',
    ['@babel/plugin-transform-class-properties', { loose: true }],
    '@babel/plugin-transform-classes',
    // Add useful transforms for modern JS features
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
  
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      // Use modules: 'commonjs' for Jest compatibility
      modules: 'commonjs',
      // Only include polyfills and transforms needed for the current Node version
      useBuiltIns: 'usage',
      corejs: 3,
    }],
    '@babel/preset-typescript',
    // Add React preset for JSX support
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  
  // Ignore node_modules except for specific packages that need transformation
  ignore: [
    /node_modules\/(?!(@your-org|some-package-that-needs-transformation))/
  ],
};