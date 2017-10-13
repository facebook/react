/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
  });

  it('unmounts children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    expect(container.textContent).toEqual('');
  });
});
