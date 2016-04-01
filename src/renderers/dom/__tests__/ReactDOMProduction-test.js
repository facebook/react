/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMProduction', function() {
  var oldProcess;

  var React;
  var ReactDOM;

  beforeEach(function() {
    __DEV__ = false;
    oldProcess = process;
    global.process = {env: {NODE_ENV: 'production'}};

    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  afterEach(function() {
    __DEV__ = true;
    global.process = oldProcess;
  });

  it('should use prod fbjs', function() {
    var warning = require('warning');

    spyOn(console, 'error');
    warning(false, 'Do cows go moo?');
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('should use prod React', function() {
    spyOn(console, 'error');

    // no key warning
    void <div>{[<span />]}</div>;

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('should handle a simple flow', function() {
    var Component = React.createClass({
      render: function() {
        return <span>{this.props.children}</span>;
      },
    });

    var container = document.createElement('div');
    var inst = ReactDOM.render(
      <div className="blue">
        <Component key={1}>A</Component>
        <Component key={2}>B</Component>
        <Component key={3}>C</Component>
      </div>,
      container
    );

    expect(container.firstChild).toBe(inst);
    expect(inst.className).toBe('blue');
    expect(inst.textContent).toBe('ABC');

    ReactDOM.render(
      <div className="red">
        <Component key={2}>B</Component>
        <Component key={1}>A</Component>
        <Component key={3}>C</Component>
      </div>,
      container
    );

    expect(inst.className).toBe('red');
    expect(inst.textContent).toBe('BAC');

    ReactDOM.unmountComponentAtNode(container);

    expect(container.childNodes.length).toBe(0);
  });

});
