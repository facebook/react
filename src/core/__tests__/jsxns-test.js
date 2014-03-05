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
 * @jsxns {"MyNamespace":"SampleNamespace"}
 * @emails react-core
 */

"use strict";

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

var reactComponentExpect= require('reactComponentExpect');

var SampleNamespace = {
  ComponentA: React.createClass({
    render: function() {
      return (
        <MyNamespace:ComponentB ref="childComponent">
          <p>Test</p>
        </MyNamespace:ComponentB>
      );
    }
  }),

  ComponentB: React.createClass({
    render: function() {
      return (
        <div className="wrapper">
          {this.props.children}
        </div>
      );
    }
  })
};

var renderJSXNSComponent = function() {
  var testJSXNSComponent =
      ReactTestUtils.renderIntoDocument(<MyNamespace:ComponentA />);

  reactComponentExpect(testJSXNSComponent)
      .toBeCompositeComponentWithType(SampleNamespace.ComponentA);

  var generalContainer = testJSXNSComponent.refs.childComponent;

  reactComponentExpect(generalContainer)
      .toBeCompositeComponentWithType(SampleNamespace.ComponentB);

  return testJSXNSComponent;
};

describe('jsxns', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  /**
   * Ensure that component respects namespace correctly.
   */
  it("Should render namespaced components correctly", function() {
    var testJSXNSComponent = renderJSXNSComponent();

    var child = ReactTestUtils.findRenderedDOMComponentWithClass(testJSXNSComponent, 'wrapper');

    expect(child).toBeDefined();
  });

  /**
   * Fails for undefined namespaces.
   */
   it("Should fail for undefined namespace", function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument(<MyNamespace:ComponentC />);
    }).toThrow();
   });
});
