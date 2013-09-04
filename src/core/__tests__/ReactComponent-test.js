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
var ReactMount;
var ReactTestUtils;

var reactComponentExpect;

describe('ReactComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactMount = require('ReactMount');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    // This module is whitelisted from automocking so manually
    // reset it.
    ReactMount.allowFullPageRender = false;
  });

  it('should be able to switch root constructors via state', function() {
    var Component = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              Hello world
            </body>
          </html>
        );
      }
    });

    var Component2 = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              Goodbye world
            </body>
          </html>
        );
      }
    });

    var Root = React.createClass({
      getInitialState: function() {
        return {toggled: false};
      },
      toggle: function() {
        this.setState({toggled: !this.state.toggled});
      },
      render: function() {
        if (this.state.toggled) {
          return <Component2 />;
        }
        return <Component />;
      }
    });

    ReactMount.allowFullPageRender = true;
    var component = React.renderComponent(<Root />, document);

    expect(document.body.innerHTML).toBe(' Hello world ');

    // Reactive update via state transition
    component.toggle();

    expect(document.body.innerHTML).toBe(' Goodbye world ');

  });

  it('should be able to switch root constructors', function() {
    var Component = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              Hello world
            </body>
          </html>
        );
      }
    });

    var Component2 = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              Goodbye world
            </body>
          </html>
        );
      }
    });

    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Component />, document);

    expect(document.body.innerHTML).toBe(' Hello world ');

    // Reactive update
    React.renderComponent(<Component2 />, document);

    expect(document.body.innerHTML).toBe(' Goodbye world ');

  });

  it('should be able to update a root component', function() {
    var Component = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              {this.props.text}
            </body>
          </html>
        );
      }
    });
    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Component text="Hello world" />, document);

    expect(document.body.innerHTML).toBe('Hello world');

    // Add a sentinel to be sure we don't blow away old nodes
    document.getElementsByTagName('title')[0].setAttribute(
      'data-yolo-king',
      'phunt'
    );
    var oldHead = document.head.innerHTML;
    expect(oldHead.indexOf('data-yolo-king') > -1).toBe(true);

    // Reactive update
    React.renderComponent(<Component text="Goodbye world" />, document);

    expect(document.body.innerHTML).toBe('Goodbye world');

    // Head has not changed, nodes were not blown away.
    expect(document.head.innerHTML).toEqual(oldHead);
  });

  it('should be able to mount into document', function() {
    var Component = React.createClass({
      render: function() {
        return (
          <html>
            <head>
              <title>Hello World</title>
            </head>
            <body>
              {this.props.text}
            </body>
          </html>
        );
      }
    });
    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Component text="Hello world" />, document);

    expect(document.body.innerHTML).toBe('Hello world');
  });

  it('should not throw on full document rendering', function() {
    var container = {nodeType: 9};
    expect(function() {
      React.renderComponent(<div></div>, container);
    }).toThrow(
      'Invariant Violation: mountComponentIntoNode(...): Target container is ' +
      'not valid.'
    );
    ReactMount.allowFullPageRender = true;
    expect(function() {
      React.renderComponent(<div></div>, container);
    }).not.toThrow();
  });

  it('should throw on invalid render targets', function() {
    var container = document.createElement('div');
    // jQuery objects are basically arrays; people often pass them in by mistake
    expect(function() {
      React.renderComponent(<div></div>, [container]);
    }).toThrow(
      'Invariant Violation: mountComponentIntoNode(...): Target container is ' +
      'not valid.'
    );

    expect(function() {
      React.renderComponent(<div></div>, null);
    }).toThrow(
      'Invariant Violation: mountComponentIntoNode(...): Target container is ' +
      'not valid.'
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

});
