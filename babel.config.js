'use strict';

module.exports = {
  //   babelrcRoots: ['examples/*'],
  presets: ['@babel/preset-react', '@babel/preset-flow'],
  //   ignore: ['third_party'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    'syntax-trailing-function-commas',
    ['@babel/plugin-proposal-object-rest-spread', {useBuiltIns: true}],
    ['@babel/plugin-transform-template-literals', {loose: true}],
    '@babel/plugin-transform-literals',
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-transform-block-scoped-functions',
    ['@babel/plugin-transform-classes', {loose: true}],
    '@babel/plugin-transform-object-super',
    '@babel/plugin-transform-shorthand-properties',
    '@babel/plugin-transform-computed-properties',
    '@babel/plugin-transform-for-of',
    ['@babel/plugin-transform-spread', {loose: true}],
    '@babel/plugin-transform-parameters',
    ['@babel/plugin-transform-destructuring', {loose: true}],
    ['@babel/plugin-transform-block-scoping', {throwIfClosureRequired: true}],
  ],
};
