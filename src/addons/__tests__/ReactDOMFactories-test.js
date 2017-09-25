/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('React');
var {div} = require('ReactDOMFactories');

describe('ReactDOMFactories', () => {
  it('allow factories to be called without warnings', () => {
    spyOn(console, 'error');
    spyOn(console, 'warn');
    var element = div();
    expect(element.type).toBe('div');
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns once when accessing React.DOM methods', () => {
    spyOn(console, 'warn');

    var a = React.DOM.a();
    var p = React.DOM.p();

    expect(a.type).toBe('a');
    expect(p.type).toBe('p');

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.calls.first().args[0]).toContain(
      'Warning: Accessing factories like React.DOM.a has been deprecated',
    );
  });
});
