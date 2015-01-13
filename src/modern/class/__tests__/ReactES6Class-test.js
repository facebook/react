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

var mocks = require('mocks');

var React;

describe('ReactES6Class', function() {

  var container;
  var Inner;
  var attachedListener = null;
  var renderedName = null;

  beforeEach(function() {
    React = require('React');
    container = document.createElement();
    attachedListener = null;
    renderedName = null;
    Inner = class extends React.Component {
      getName() {
        return this.props.name;
      }
      render() {
        attachedListener = this.props.onClick;
        renderedName = this.props.name;
        return <div className={this.props.name} />;
      }
    };
  });

  function test(element, expectedTag, expectedClassName) {
    var instance = React.render(element, container);
    expect(container.firstChild).not.toBeNull();
    expect(container.firstChild.tagName).toBe(expectedTag);
    expect(container.firstChild.className).toBe(expectedClassName);
    return instance;
  }

  it('preserves the name of the class for use in error messages', function() {
    class Foo extends React.Component { }
    expect(Foo.name).toBe('Foo');
  });

  it('throws if no render function is defined', function() {
    class Foo extends React.Component { }
    expect(() => React.render(<Foo />, container)).toThrow();
  });

  it('renders a simple stateless component with prop', function() {
    class Foo {
      render() {
        return <Inner name={this.props.bar} />;
      }
    }
    test(<Foo bar="foo" />, 'DIV', 'foo');
    test(<Foo bar="bar" />, 'DIV', 'bar');
  });

  it('renders using forceUpdate even when there is no state', function() {
    class Foo extends React.Component {
      constructor(props) {
        this.mutativeValue = props.initialValue;
      }
      handleClick() {
        this.mutativeValue = 'bar';
        this.forceUpdate();
      }
      render() {
        return (
          <Inner
            name={this.mutativeValue}
            onClick={this.handleClick.bind(this)}
          />
        );
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('should throw AND warn when trying to access classic APIs', function() {
    spyOn(console, 'warn');
    var instance = test(<Inner name="foo" />, 'DIV', 'foo');
    expect(() => instance.getDOMNode()).toThrow();
    expect(() => instance.replaceState({})).toThrow();
    expect(() => instance.isMounted()).toThrow();
    expect(() => instance.setProps({ name: 'bar' })).toThrow();
    expect(console.warn.calls.length).toBe(4);
    expect(console.warn.calls[0].args[0]).toContain(
      'getDOMNode(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[1].args[0]).toContain(
      'replaceState(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[2].args[0]).toContain(
      'isMounted(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[3].args[0]).toContain(
      'setProps(...) is deprecated in plain JavaScript React classes'
    );
  });

  it('supports this.context passed via getChildContext', function() {
    class Bar {
      render() {
        return <div className={this.context.bar} />;
      }
    }
    Bar.contextTypes = { bar: React.PropTypes.string };
    class Foo {
      getChildContext() {
        return { bar: 'bar-through-context' };
      }
      render() {
        return <Bar />;
      }
    }
    Foo.childContextTypes = { bar: React.PropTypes.string };
    test(<Foo />, 'DIV', 'bar-through-context');
  });

  it('supports classic refs', function() {
    class Foo {
      render() {
        return <Inner name="foo" ref="inner" />;
      }
    }
    var instance = test(<Foo />, 'DIV', 'foo');
    expect(instance.refs.inner.getName()).toBe('foo');
  });

  it('supports drilling through to the DOM using findDOMNode', function() {
    var instance = test(<Inner name="foo" />, 'DIV', 'foo');
    var node = React.findDOMNode(instance);
    expect(node).toBe(container.firstChild);
  });

});
