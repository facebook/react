/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactFeatureFlags;

describe('ReactElement', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableCreateElementDeprecationWarnings = true;
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should warn when createElement is accessed ', () => {
    const container = document.createElement('div');
    expect(() =>
      ReactDOM.render(React.createElement('div'), container),
    ).toWarnDev(
      'Warning: div: You are most likely getting this warning because ' +
        'you are spreading an object on an element while passing it a explicit ' +
        'key in the format `<div {...props} key={keyVal} />`. To fix this, ' +
        'switch the key and the props spread to `<div key={keyVal} {...props} />`.' +
        '\n\n' +
        'If you are explicitly calling React.createElement, please switch to ' +
        'React.jsx instead.' +
        '\n\n' +
        'If you have not upgraded the @babel/plugin-transform-react-jsx to the latest ' +
        'version, please do so.',
      {withoutStack: true},
    );
  });
});
