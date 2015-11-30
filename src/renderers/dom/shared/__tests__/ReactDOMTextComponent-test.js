/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;

describe('ReactDOMTextComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  it('updates a mounted text component in place', function() {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div>{'foo'}{'bar'}</div>, el);

    var foo = ReactDOM.findDOMNode(inst).children[0];
    var bar = ReactDOM.findDOMNode(inst).children[1];
    expect(foo.tagName).toBe('SPAN');
    expect(bar.tagName).toBe('SPAN');

    inst = ReactDOM.render(<div>{'baz'}{'qux'}</div>, el);
    // After the update, the spans should have stayed in place (as opposed to
    // getting unmounted and remounted)
    expect(ReactDOM.findDOMNode(inst).children[0]).toBe(foo);
    expect(ReactDOM.findDOMNode(inst).children[1]).toBe(bar);
  });
});
