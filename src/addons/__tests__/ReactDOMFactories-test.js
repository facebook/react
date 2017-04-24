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

var React = require('React');
var {div} = require('ReactDOMFactories');

describe('ReactDOMFactories', () => {
  it('allow factories to be called without warnings', () => {
    spyOn(console, 'error');
    var element = div();
    expect(element.type).toBe('div');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('warns once when accessing React.DOM methods', () => {
    spyOn(console, 'error');

    var a = React.DOM.a();
    var p = React.DOM.p();

    expect(a.type).toBe('a');
    expect(p.type).toBe('p');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error.calls.first().args[0]).toContain(
      'Warning: Accessing factories like React.DOM.a has been deprecated',
    );
  });
});
