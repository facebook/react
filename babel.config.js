'use strict';

module.exports = {
  presets: ['@babel/react', '@babel/preset-flow'],
  ignore: ['third_party'],
  plugins: [
    '@babel/proposal-class-properties',
    'syntax-trailing-function-commas',
    ['@babel/proposal-object-rest-spread', {useBuiltIns: true}],
    '@babel/transform-template-literals',
    '@babel/transform-literals',
    '@babel/plugin-transform-arrow-functions',
    '@babel/transform-block-scoped-functions',
    '@babel/plugin-transform-classes',
    '@babel/transform-object-super',
    '@babel/transform-shorthand-properties',
    '@babel/transform-computed-properties',
    '@babel/transform-for-of',
    ['@babel/transform-spread', {loose: true}],
    '@babel/transform-parameters',
    ['@babel/transform-destructuring', {loose: true}],
    ['@babel/transform-block-scoping', {throwIfClosureRequired: true}],
  ],
};
