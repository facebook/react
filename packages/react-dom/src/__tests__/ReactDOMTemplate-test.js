
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMTemplate', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should render template element with children', () => {
    const container = document.createElement('div');
    ReactDOM.render(<template><div /></template>, container);
    expect(container.firstChild.content.firstChild.tagName).toBe('DIV');
  });

  it('should render template element with text children', () => {
    const container = document.createElement('div');
    ReactDOM.render(<template>Hello</template>, container);
    expect(container.firstChild.content.textContent).toBe('Hello');
  });
});
