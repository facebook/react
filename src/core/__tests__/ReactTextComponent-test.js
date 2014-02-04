/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
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
    var thing = React.DOM.div(null, React.DOM.span({key:ThisThingShouldBeEscaped}, ["LULZ"]));
    var html = React.renderComponentToString(thing);
    expect(html).not.toContain(ThisThingShouldBeEscaped);
    expect(html).toContain(ThisThingWasBeEscaped);
  })
});
