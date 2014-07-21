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

var mocks = require('mocks');

describe('ReactMount', function() {
  var React = require('React');
  var ReactMount = require('ReactMount');
  var ReactTestUtils = require('ReactTestUtils');

  describe('constructAndRenderComponentByID', function() {
    it('throws if given an id for a component that doesn\'t exist', function() {
      expect(function() {
        ReactMount.constructAndRenderComponentByID(
          function dummyComponentConstructor() {},
          {},
          'SOME_ID_THAT_DOESNT_EXIST'
        );
      }).toThrow();
    });
  });

  it('throws when given a factory', function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument(React.DOM.div);
    }).toThrow(
      'Invariant Violation: renderComponent(): Invalid component descriptor. ' +
      'Instead of passing a component class, make sure to instantiate it ' +
      'first by calling it with props.'
    );

    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(Component);
    }).toThrow(
      'Invariant Violation: renderComponent(): Invalid component descriptor. ' +
      'Instead of passing a component class, make sure to instantiate it ' +
      'first by calling it with props.'
    );
  });

  it('should render different components in same root', function() {
    var container = document.createElement('container');
    document.documentElement.appendChild(container);

    ReactMount.renderComponent(<div></div>, container);
    expect(container.firstChild.nodeName).toBe('DIV');

    ReactMount.renderComponent(<span></span>, container);
    expect(container.firstChild.nodeName).toBe('SPAN');
  });

  it('should unmount and remount if the key changes', function() {
    var container = document.createElement('container');

    var mockMount = mocks.getMockFunction();
    var mockUnmount = mocks.getMockFunction();

    var Component = React.createClass({
      componentDidMount: mockMount,
      componentWillUnmount: mockUnmount,
      render: function() {
        return <span>{this.props.text}</span>;
      }
    });

    expect(mockMount.mock.calls.length).toBe(0);
    expect(mockUnmount.mock.calls.length).toBe(0);

    ReactMount.renderComponent(<Component text="orange" key="A" />, container);
    expect(container.firstChild.innerHTML).toBe('orange');
    expect(mockMount.mock.calls.length).toBe(1);
    expect(mockUnmount.mock.calls.length).toBe(0);

    // If we change the key, the component is unmounted and remounted
    ReactMount.renderComponent(<Component text="green" key="B" />, container);
    expect(container.firstChild.innerHTML).toBe('green');
    expect(mockMount.mock.calls.length).toBe(2);
    expect(mockUnmount.mock.calls.length).toBe(1);

    // But if we don't change the key, the component instance is reused
    ReactMount.renderComponent(<Component text="blue" key="B" />, container);
    expect(container.firstChild.innerHTML).toBe('blue');
    expect(mockMount.mock.calls.length).toBe(2);
    expect(mockUnmount.mock.calls.length).toBe(1);
  });

  it('should reuse markup if rendering to the same target twice', function() {
    var container = document.createElement('container');
    var instance1 = React.renderComponent(<div />, container);
    var instance2 = React.renderComponent(<div />, container);

    expect(instance1 === instance2).toBe(true);
  });
});
