/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';
describe('ReactDOMVideo', () => {
  let React;
  let ReactDOM;
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should warn if muted and defaultMuted props are specified', () => {
    const InvalidComponent = () => <video muted={true} defaultMuted={true} />;
    expect(() => ReactDOM.render(<InvalidComponent />, container)).toErrorDev(
      'InvalidComponent contains a media element with both muted and defaultMuted props. ' +
        '(specify either the muted prop, or the defaultMuted prop, but not ' +
        'both).',
    );
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should defaultMuted set muted to true', () => {
    const _container = document.createElement('div');
    ReactDOM.render(<video defaultMuted={true} />, _container);
    const node = _container.firstChild;

    expect(node.muted).toBe(true);
    ReactDOM.unmountComponentAtNode(_container);
  });

  it('should defaultMuted set muted to false', () => {
    const _container = document.createElement('div');
    ReactDOM.render(<video defaultMuted={false} />, _container);
    const node = _container.firstChild;

    expect(node.muted).toBe(false);
    ReactDOM.unmountComponentAtNode(_container);
  });
});
