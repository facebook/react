/**
 * Copyright 2014 Facebook, Inc.
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
var ReactTestUtils;

var mocks = require('mocks');

describe('ClickOutsideEventPlugin', function() {
  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should dispatch onClickOutside properly', function() {
    var handlerA = mocks.getMockFunction();
    var handlerB = mocks.getMockFunction();
    var handlerC = mocks.getMockFunction();
    var handlerD = mocks.getMockFunction();

    var Component = React.createClass({
      render: function() {
        return (
          <div ref="a" onClickOutside={handlerA}>
            <div ref="b" onClickOutside={handlerB}>
              <div ref="c" onClickOutside={handlerC} />
            </div>
            <div ref="d" onClickOutside={handlerD} />
          </div>
        );
      }
    });
    var component = ReactTestUtils.renderIntoDocument(<Component />);

    ReactTestUtils.SimulateNative.click(component.refs.d);

    expect(handlerA.mock.calls.length).toBe(0);
    expect(handlerB.mock.calls.length).toBe(1);
    expect(handlerC.mock.calls.length).toBe(1);
    expect(handlerD.mock.calls.length).toBe(0);
  });
});
