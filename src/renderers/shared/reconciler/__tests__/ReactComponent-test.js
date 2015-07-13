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
var ReactTestUtils;

var mocks;

describe('ReactComponent', function() {
  beforeEach(function() {
    mocks = require('mocks');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should throw on invalid render targets', function() {
    var container = document.createElement('div');
    // jQuery objects are basically arrays; people often pass them in by mistake
    expect(function() {
      React.render(<div></div>, [container]);
    }).toThrow(
      'Invariant Violation: _registerComponent(...): Target container ' +
      'is not a DOM element.'
    );

    expect(function() {
      React.render(<div></div>, null);
    }).toThrow(
      'Invariant Violation: _registerComponent(...): Target container ' +
      'is not a DOM element.'
    );
  });

  it('should throw when supplying a ref outside of render method', function() {
    var instance = <div ref="badDiv" />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should support refs on owned components', function() {
    var innerObj = {}, outerObj = {};

    var Wrapper = React.createClass({

      getObject: function() {
        return this.props.object;
      },

      render: function() {
        return <div>{this.props.children}</div>;
      },

    });

    var Component = React.createClass({
      render: function() {
        var inner = <Wrapper object={innerObj} ref="inner" />;
        var outer = <Wrapper object={outerObj} ref="outer">{inner}</Wrapper>;
        return outer;
      },
      componentDidMount: function() {
        expect(this.refs.inner.getObject()).toEqual(innerObj);
        expect(this.refs.outer.getObject()).toEqual(outerObj);
      },
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should not have refs on unmounted components', function() {
    var Parent = React.createClass({
      render: function() {
        return <Child><div ref="test" /></Child>;
      },
      componentDidMount: function() {
        expect(this.refs && this.refs.test).toEqual(undefined);
      },
    });
    var Child = React.createClass({
      render: function() {
        return <div />;
      },
    });

    var instance = <Parent child={<span />} />;
    instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should support new-style refs', function() {
    var innerObj = {}, outerObj = {};

    var Wrapper = React.createClass({
      getObject: function() {
        return this.props.object;
      },
      render: function() {
        return <div>{this.props.children}</div>;
      },
    });

    var mounted = false;
    var Component = React.createClass({
      render: function() {
        var inner = <Wrapper object={innerObj} ref={(c) => this.innerRef = c} />;
        var outer = (
          <Wrapper object={outerObj} ref={(c) => this.outerRef = c}>
            {inner}
          </Wrapper>
        );
        return outer;
      },
      componentDidMount: function() {
        expect(this.innerRef.getObject()).toEqual(innerObj);
        expect(this.outerRef.getObject()).toEqual(outerObj);
        mounted = true;
      },
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(mounted).toBe(true);
  });

  it('should support new-style refs with mixed-up owners', function() {
    var Wrapper = React.createClass({
      getTitle: function() {
        return this.props.title;
      },
      render: function() {
        return this.props.getContent();
      },
    });

    var mounted = false;
    var Component = React.createClass({
      getInner: function() {
        // (With old-style refs, it's impossible to get a ref to this div
        // because Wrapper is the current owner when this function is called.)
        return <div title="inner" ref={(c) => this.innerRef = c} />;
      },
      render: function() {
        return (
          <Wrapper
            title="wrapper"
            ref={(c) => this.wrapperRef = c}
            getContent={this.getInner}
            />
        );
      },
      componentDidMount: function() {
        // Check .props.title to make sure we got the right elements back
        expect(this.wrapperRef.getTitle()).toBe('wrapper');
        expect(React.findDOMNode(this.innerRef).title).toBe('inner');
        mounted = true;
      },
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(mounted).toBe(true);
  });

  it('should call refs at the correct time', function() {
    var log = [];

    var Inner = React.createClass({
      render: function() {
        log.push(`inner ${this.props.id} render`);
        return <div />;
      },
      componentDidMount: function() {
        log.push(`inner ${this.props.id} componentDidMount`);
      },
      componentDidUpdate: function() {
        log.push(`inner ${this.props.id} componentDidUpdate`);
      },
      componentWillUnmount: function() {
        log.push(`inner ${this.props.id} componentWillUnmount`);
      },
    });

    var Outer = React.createClass({
      render: function() {
        return (
          <div>
            <Inner id={1} ref={(c) => {
              log.push(`ref 1 got ${c ? `instance ${c.props.id}` : 'null'}`);
            }}/>
            <Inner id={2} ref={(c) => {
              log.push(`ref 2 got ${c ? `instance ${c.props.id}` : 'null'}`);
            }}/>
          </div>
        );
      },
      componentDidMount: function() {
        log.push('outer componentDidMount');
      },
      componentDidUpdate: function() {
        log.push('outer componentDidUpdate');
      },
      componentWillUnmount: function() {
        log.push('outer componentWillUnmount');
      },
    });

    // mount, update, unmount
    var el = document.createElement('div');
    log.push('start mount');
    React.render(<Outer />, el);
    log.push('start update');
    React.render(<Outer />, el);
    log.push('start unmount');
    React.unmountComponentAtNode(el);

    expect(log).toEqual([
      'start mount',
        'inner 1 render',
        'inner 2 render',
        'inner 1 componentDidMount',
        'ref 1 got instance 1',
        'inner 2 componentDidMount',
        'ref 2 got instance 2',
        'outer componentDidMount',
      'start update',
        // Previous (equivalent) refs get cleared
        'ref 1 got null',
        'inner 1 render',
        'ref 2 got null',
        'inner 2 render',
        'inner 1 componentDidUpdate',
        'ref 1 got instance 1',
        'inner 2 componentDidUpdate',
        'ref 2 got instance 2',
        'outer componentDidUpdate',
      'start unmount',
        'outer componentWillUnmount',
        'ref 1 got null',
        'inner 1 componentWillUnmount',
        'ref 2 got null',
        'inner 2 componentWillUnmount',
    ]);
  });

  it('fires the callback after a component is rendered', function() {
    var callback = mocks.getMockFunction();
    var container = document.createElement('div');
    React.render(<div />, container, callback);
    expect(callback.mock.calls.length).toBe(1);
    React.render(<div className="foo" />, container, callback);
    expect(callback.mock.calls.length).toBe(2);
    React.render(<span />, container, callback);
    expect(callback.mock.calls.length).toBe(3);
  });

  it('warns when calling getDOMNode', function() {
    spyOn(console, 'error');

    var Potato = React.createClass({
      render: function() {
        return <div />;
      },
    });
    var container = document.createElement('div');
    var instance = React.render(<Potato />, container);

    instance.getDOMNode();

    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain(
      'Potato.getDOMNode(...) is deprecated. Please use ' +
      'React.findDOMNode(instance) instead.'
    );
  });

  it('throws usefully when rendering badly-typed elements', function() {
    spyOn(console, 'error');

    var X = undefined;
    expect(() => ReactTestUtils.renderIntoDocument(<X />)).toThrow(
      'Invariant Violation: Element type is invalid: expected a string (for ' +
      'built-in components) or a class/function (for composite components) ' +
      'but got: undefined.'
    );

    var Y = null;
    expect(() => ReactTestUtils.renderIntoDocument(<Y />)).toThrow(
      'Invariant Violation: Element type is invalid: expected a string (for ' +
      'built-in components) or a class/function (for composite components) ' +
      'but got: null.'
    );

    var Z = {};
    expect(() => ReactTestUtils.renderIntoDocument(<Z />)).toThrow(
      'Invariant Violation: Element type is invalid: expected a string (for ' +
      'built-in components) or a class/function (for composite components) ' +
      'but got: object.'
    );

    // One warning for each element creation
    expect(console.error.calls.length).toBe(3);
  });

});
