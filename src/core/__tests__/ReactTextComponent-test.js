/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var React;

describe('ReactTextComponent', function() {
  beforeEach(function() {
    React = require('React');
  });

  it('should escape the rootID', function(){
    var ThisThingShouldBeEscaped = '">>> LULZ <<<"';
    var ThisThingWasBeEscaped = '&quot;&gt;&gt;&gt; LULZ &lt;&lt;&lt;&quot;';
    var thing = <div><span key={ThisThingShouldBeEscaped}>LULZ</span></div>;
    var html = React.renderToString(thing);
    expect(html).not.toContain(ThisThingShouldBeEscaped);
    expect(html).toContain(ThisThingWasBeEscaped);
  })
});
