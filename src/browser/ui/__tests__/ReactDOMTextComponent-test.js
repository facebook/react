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

describe('ReactDOMTextComponent', function() {
  beforeEach(function() {
    React = require('React');
  });

  it('should escape the rootID', function() {
    var ThisThingShouldBeEscaped = '">>> LULZ <<<"';
    var ThisThingWasBeEscaped = '&quot;&gt;&gt;&gt; LULZ &lt;&lt;&lt;&quot;';
    var thing = <div><span key={ThisThingShouldBeEscaped}>LULZ</span></div>;
    var html = React.renderToString(thing);
    expect(html).not.toContain(ThisThingShouldBeEscaped);
    expect(html).toContain(ThisThingWasBeEscaped);
  });

  it('updates a mounted text component in place', function() {
    var el = document.createElement('div');
    var inst = React.render(<div>{'foo'}{'bar'}</div>, el);

    var foo = inst.getDOMNode().children[0];
    var bar = inst.getDOMNode().children[1];
    expect(foo.tagName).toBe('SPAN');
    expect(bar.tagName).toBe('SPAN');

    inst = React.render(<div>{'baz'}{'qux'}</div>, el);
    // After the update, the spans should have stayed in place (as opposed to
    // getting unmounted and remounted)
    expect(inst.getDOMNode().children[0]).toBe(foo);
    expect(inst.getDOMNode().children[1]).toBe(bar);
  });
});
