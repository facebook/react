/**
 * Copyright 2013 Facebook, Inc.
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

var reactComponentExpect;

describe('ReactComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should throw on invalid render targets', function() {
    var container = document.createElement('div');
    // jQuery objects are basically arrays; people often pass them in by mistake
    expect(function() {
      React.renderComponent(<div></div>, [container]);
    }).toThrow(
      'Invariant Violation: prepareEnvironmentForDOM(...): Target container ' +
      'is not a DOM element.'
    );

    expect(function() {
      React.renderComponent(<div></div>, null);
    }).toThrow(
      'Invariant Violation: prepareEnvironmentForDOM(...): Target container ' +
      'is not a DOM element.'
    );
  });

  it('should throw when supplying a ref outside of render method', function() {
    var instance = <div ref="badDiv" />;
    expect(function() {
      ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should throw when attempting to hijack a ref', function() {
    var Component = React.createClass({
      render: function() {
        var child = this.props.child;
        this.attachRef('test', child);
        return child;
      }
    });

    var instance = <Component child={<span />} />;

    expect(function() {
      ReactTestUtils.renderIntoDocument(instance);
    }).toThrow(
      'Invariant Violation: attachRef(test, ...): Only a component\'s owner ' +
      'can store a ref to it.'
    );
  });

  it('should support refs on owned components', function() {
    var inner, outer;

    var Component = React.createClass({
      render: function() {
        inner = <div ref="inner" />;
        outer = <div ref="outer">{inner}</div>;
        return outer;
      },
      componentDidMount: function() {
        expect(this.refs.inner).toEqual(inner);
        expect(this.refs.outer).toEqual(outer);
      }
    });

    var instance = <Component child={<span />} />;
    ReactTestUtils.renderIntoDocument(instance);
  });

  it('should not have refs on unmounted components', function() {
    var Parent = React.createClass({
      render: function() {
        return <Child><div ref="test" /></Child>;
      },
      componentDidMount: function() {
        expect(this.refs && this.refs.test).toEqual(undefined);
      }
    });
    var Child = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Parent child={<span />} />;
    ReactTestUtils.renderIntoDocument(instance);
  });

  it('should correctly determine if a component is mounted', function() {
    var Component = React.createClass({
      componentWillMount: function() {
        expect(this.isMounted()).toBeFalsy();
      },
      componentDidMount: function() {
        expect(this.isMounted()).toBeTruthy();
      },
      render: function() {
        return <div/>;
      }
    });

    var instance = <Component />;

    expect(instance.isMounted()).toBeFalsy();
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.isMounted()).toBeTruthy();
  });

  it('should know its simple mount depth', function() {
    var Owner = React.createClass({
      render: function() {
        return <Child ref="child" />;
      }
    });

    var Child = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Owner />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance._mountDepth).toBe(0);
    expect(instance.refs.child._mountDepth).toBe(1);
  });

  it('should know its (complicated) mount depth', function() {
    var Box = React.createClass({
      render: function() {
        return <div ref="boxDiv">{this.props.children}</div>;
      }
    });

    var Child = React.createClass({
      render: function() {
        return <span ref="span">child</span>;
      }
    });

    var Switcher = React.createClass({
      getInitialState: function() {
        return {tabKey: 'hello'};
      },

      render: function() {
        var child = this.props.children;

        return (
          <Box ref="box">
            <div
              ref="switcherDiv"
              style={{
                display: this.state.tabKey === child.key ? '' : 'none'
            }}>
              {child}
            </div>
          </Box>
        );
      }
    });

    var App = React.createClass({
      render: function() {
        return (
          <Switcher ref="switcher">
            <Child key="hello" ref="child" />
          </Switcher>
        );
      }
    });

    var root = <App />;
    ReactTestUtils.renderIntoDocument(root);

    expect(root._mountDepth).toBe(0);
    expect(root.refs.switcher._mountDepth).toBe(1);
    expect(root.refs.switcher.refs.box._mountDepth).toBe(2);
    expect(root.refs.switcher.refs.switcherDiv._mountDepth).toBe(4);
    expect(root.refs.child._mountDepth).toBe(5);
    expect(root.refs.switcher.refs.box.refs.boxDiv._mountDepth).toBe(3);
    expect(root.refs.child.refs.span._mountDepth).toBe(6);
  });
});
