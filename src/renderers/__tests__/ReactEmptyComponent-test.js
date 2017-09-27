/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactTestUtils;
var TogglingComponent;

var log;

describe('ReactEmptyComponent', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');

    log = jasmine.createSpy();

    TogglingComponent = class extends React.Component {
      state = {component: this.props.firstComponent};

      componentDidMount() {
        log(ReactDOM.findDOMNode(this));
        this.setState({component: this.props.secondComponent});
      }

      componentDidUpdate() {
        log(ReactDOM.findDOMNode(this));
      }

      render() {
        var Component = this.state.component;
        return Component ? <Component /> : null;
      }
    };
  });

  it('should not produce child DOM nodes for null and false', () => {
    class Component1 extends React.Component {
      render() {
        return null;
      }
    }

    class Component2 extends React.Component {
      render() {
        return false;
      }
    }

    var container1 = document.createElement('div');
    ReactDOM.render(<Component1 />, container1);
    expect(container1.children.length).toBe(0);

    var container2 = document.createElement('div');
    ReactDOM.render(<Component2 />, container2);
    expect(container2.children.length).toBe(0);
  });

  it('should still throw when rendering to undefined', () => {
    class Component extends React.Component {
      render() {}
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).toThrowError(
      'Component(...): Nothing was returned from render. This usually means a return statement is missing. ' +
        'Or, to render nothing, return null.',
    );
  });

  it('should be able to switch between rendering null and a normal tag', () => {
    var instance1 = (
      <TogglingComponent firstComponent={null} secondComponent={'div'} />
    );
    var instance2 = (
      <TogglingComponent firstComponent={'div'} secondComponent={null} />
    );

    ReactTestUtils.renderIntoDocument(instance1);
    ReactTestUtils.renderIntoDocument(instance2);

    expect(log.calls.count()).toBe(4);
    expect(log.calls.argsFor(0)[0]).toBe(null);
    expect(log.calls.argsFor(1)[0].tagName).toBe('DIV');
    expect(log.calls.argsFor(2)[0].tagName).toBe('DIV');
    expect(log.calls.argsFor(3)[0]).toBe(null);
  });

  it('should be able to switch in a list of children', () => {
    var instance1 = (
      <TogglingComponent firstComponent={null} secondComponent={'div'} />
    );

    ReactTestUtils.renderIntoDocument(
      <div>
        {instance1}
        {instance1}
        {instance1}
      </div>,
    );

    expect(log.calls.count()).toBe(6);
    expect(log.calls.argsFor(0)[0]).toBe(null);
    expect(log.calls.argsFor(1)[0]).toBe(null);
    expect(log.calls.argsFor(2)[0]).toBe(null);
    expect(log.calls.argsFor(3)[0].tagName).toBe('DIV');
    expect(log.calls.argsFor(4)[0].tagName).toBe('DIV');
    expect(log.calls.argsFor(5)[0].tagName).toBe('DIV');
  });

  it('should distinguish between a script placeholder and an actual script tag', () => {
    var instance1 = (
      <TogglingComponent firstComponent={null} secondComponent={'script'} />
    );
    var instance2 = (
      <TogglingComponent firstComponent={'script'} secondComponent={null} />
    );

    expect(function() {
      ReactTestUtils.renderIntoDocument(instance1);
    }).not.toThrow();
    expect(function() {
      ReactTestUtils.renderIntoDocument(instance2);
    }).not.toThrow();

    expect(log.calls.count()).toBe(4);
    expect(log.calls.argsFor(0)[0]).toBe(null);
    expect(log.calls.argsFor(1)[0].tagName).toBe('SCRIPT');
    expect(log.calls.argsFor(2)[0].tagName).toBe('SCRIPT');
    expect(log.calls.argsFor(3)[0]).toBe(null);
  });

  it(
    'should have findDOMNode return null when multiple layers of composite ' +
      'components render to the same null placeholder',
    () => {
      class GrandChild extends React.Component {
        render() {
          return null;
        }
      }

      class Child extends React.Component {
        render() {
          return <GrandChild />;
        }
      }

      var instance1 = (
        <TogglingComponent firstComponent={'div'} secondComponent={Child} />
      );
      var instance2 = (
        <TogglingComponent firstComponent={Child} secondComponent={'div'} />
      );

      expect(function() {
        ReactTestUtils.renderIntoDocument(instance1);
      }).not.toThrow();
      expect(function() {
        ReactTestUtils.renderIntoDocument(instance2);
      }).not.toThrow();

      expect(log.calls.count()).toBe(4);
      expect(log.calls.argsFor(0)[0].tagName).toBe('DIV');
      expect(log.calls.argsFor(1)[0]).toBe(null);
      expect(log.calls.argsFor(2)[0]).toBe(null);
      expect(log.calls.argsFor(3)[0].tagName).toBe('DIV');
    },
  );

  it('works when switching components', () => {
    var assertions = 0;

    class Inner extends React.Component {
      render() {
        return <span />;
      }

      componentDidMount() {
        // Make sure the DOM node resolves properly even if we're replacing a
        // `null` component
        expect(ReactDOM.findDOMNode(this)).not.toBe(null);
        assertions++;
      }

      componentWillUnmount() {
        // Even though we're getting replaced by `null`, we haven't been
        // replaced yet!
        expect(ReactDOM.findDOMNode(this)).not.toBe(null);
        assertions++;
      }
    }

    class Wrapper extends React.Component {
      render() {
        return this.props.showInner ? <Inner /> : null;
      }
    }

    var el = document.createElement('div');
    var component;

    // Render the <Inner /> component...
    component = ReactDOM.render(<Wrapper showInner={true} />, el);
    expect(ReactDOM.findDOMNode(component)).not.toBe(null);

    // Switch to null...
    component = ReactDOM.render(<Wrapper showInner={false} />, el);
    expect(ReactDOM.findDOMNode(component)).toBe(null);

    // ...then switch back.
    component = ReactDOM.render(<Wrapper showInner={true} />, el);
    expect(ReactDOM.findDOMNode(component)).not.toBe(null);

    expect(assertions).toBe(3);
  });

  it('can render null at the top level', () => {
    var div = document.createElement('div');
    ReactDOM.render(null, div);
    expect(div.innerHTML).toBe('');
  });

  it('does not break when updating during mount', () => {
    class Child extends React.Component {
      componentDidMount() {
        if (this.props.onMount) {
          this.props.onMount();
        }
      }

      render() {
        if (!this.props.visible) {
          return null;
        }

        return <div>hello world</div>;
      }
    }

    class Parent extends React.Component {
      update = () => {
        this.forceUpdate();
      };

      render() {
        return (
          <div>
            <Child key="1" visible={false} />
            <Child key="0" visible={true} onMount={this.update} />
            <Child key="2" visible={false} />
          </div>
        );
      }
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Parent />);
    }).not.toThrow();
  });

  it('preserves the dom node during updates', () => {
    class Empty extends React.Component {
      render() {
        return null;
      }
    }

    var container = document.createElement('div');

    ReactDOM.render(<Empty />, container);
    var noscript1 = container.firstChild;
    expect(noscript1).toBe(null);

    // This update shouldn't create a DOM node
    ReactDOM.render(<Empty />, container);
    var noscript2 = container.firstChild;
    expect(noscript2).toBe(null);
  });
});
