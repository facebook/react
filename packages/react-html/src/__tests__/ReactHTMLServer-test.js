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
let ReactHTML;

describe('ReactHTML', () => {
  beforeEach(() => {
    jest.resetModules();
    // We run in the react-server condition.
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-html', () =>
      require('react-html/react-html.react-server'),
    );

    React = require('react');
    ReactHTML = require('react-html');
  });

  it('should be able to render a simple component', async () => {
    function Component() {
      return <div>hello world</div>;
    }

    const html = await ReactHTML.renderToMarkup(<Component />);
    expect(html).toBe('<div>hello world</div>');
  });
});
