/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactShallowRenderer;
let ReactFeatureFlags;

function HelloWorld() {
  return <h1>Hello, world!</h1>;
}

describe('ShallowRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    React = require('react');
    ReactShallowRenderer = require('../../shallow.js').default;
  });

  it('should render without warnings without enableReactTestRendererWarning', () => {
    ReactFeatureFlags.enableReactTestRendererWarning = false;
    const renderer = new ReactShallowRenderer();
    expect(renderer.render(<HelloWorld />)).toMatchSnapshot();
  });

  it('should render with warnings with enableReactTestRendererWarning', () => {
    ReactFeatureFlags.enableReactTestRendererWarning = true;
    const renderer = new ReactShallowRenderer();
    expect(() => {
      renderer.render(<HelloWorld />);
    }).toWarnDev(
      "Warning: React's Shallow Renderer export will be removed in a future release. Please use @testing-library/react instead.",
      {withoutStack: true},
    );
  });
});
