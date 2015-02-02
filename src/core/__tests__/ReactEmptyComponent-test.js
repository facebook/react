/**
 * Copyright 2014-2015, Facebook, Inc.
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
var ReactEmptyComponent;
var ReactTestUtils;
var TogglingComponent;

var reactComponentExpect;

describe('ReactEmptyComponent', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactEmptyComponent = require('ReactEmptyComponent');
    ReactTestUtils = require('ReactTestUtils');

    reactComponentExpect = require('reactComponentExpect');

    TogglingComponent = React.createClass({
      getInitialState: function() {
        return {component: this.props.firstComponent};
      },
      componentDidMount: function() {
        console.log(this.getDOMNode());
        this.setState({component: this.props.secondComponent});
      },
      componentDidUpdate: function() {
        console.log(this.getDOMNode());
      },
      render: function() {
        var Component = this.state.component;
        return Component ? <Component /> : null;
      }
    });
  });

  it('should render null and false as a noscript tag under the hood', () => {
    var Component1 = React.createClass({
      render: function() {
        return null;
      }
    });
    var Component2 = React.createClass({
      render: function() {
        return false;
      }
    });

    var instance1 = ReactTestUtils.renderIntoDocument(<Component1 />);
    var instance2 = ReactTestUtils.renderIntoDocument(<Component2 />);
    reactComponentExpect(instance1)
      .expectRenderedChild()
      .toBeComponentOfType(ReactEmptyComponent.emptyElement.type);
    reactComponentExpect(instance2)
      .expectRenderedChild()
      .toBeComponentOfType(ReactEmptyComponent.emptyElement.type);
  });

  it('should still throw when rendering to undefined', () => {
    var Component = React.createClass({
      render: function() {}
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).toThrow(
      'Invariant Violation: Component.render(): A valid ReactComponent must ' +
      'be returned. You may have returned undefined, an array or some other ' +
      'invalid object.'
    );
  });

  it('should be able to switch between rendering null and a normal tag', () => {
    spyOn(console, 'log');

    var instance1 =
      <TogglingComponent
        firstComponent={null}
        secondComponent={'div'}
      />;
    var instance2 =
      <TogglingComponent
        firstComponent={'div'}
        secondComponent={null}
      />;

    expect(function() {
      ReactTestUtils.renderIntoDocument(instance1);
      ReactTestUtils.renderIntoDocument(instance2);
    }).not.toThrow();

    expect(console.log.argsForCall.length).toBe(4);
    expect(console.log.argsForCall[0][0]).toBe(null);
    expect(console.log.argsForCall[1][0].tagName).toBe('DIV');
    expect(console.log.argsForCall[2][0].tagName).toBe('DIV');
    expect(console.log.argsForCall[3][0]).toBe(null);
  });

  it('should distinguish between a script placeholder and an actual script tag',
    () => {
      spyOn(console, 'log');

      var instance1 =
        <TogglingComponent
          firstComponent={null}
          secondComponent={'script'}
        />;
      var instance2 =
        <TogglingComponent
          firstComponent={'script'}
          secondComponent={null}
        />;

      expect(function() {
        ReactTestUtils.renderIntoDocument(instance1);
      }).not.toThrow();
      expect(function() {
        ReactTestUtils.renderIntoDocument(instance2);
      }).not.toThrow();

      expect(console.log.argsForCall.length).toBe(4);
      expect(console.log.argsForCall[0][0]).toBe(null);
      expect(console.log.argsForCall[1][0].tagName).toBe('SCRIPT');
      expect(console.log.argsForCall[2][0].tagName).toBe('SCRIPT');
      expect(console.log.argsForCall[3][0]).toBe(null);
    }
  );

  it('should have getDOMNode return null when multiple layers of composite ' +
    'components render to the same null placeholder', () => {
      spyOn(console, 'log');

      var GrandChild = React.createClass({
        render: function() {
          return null;
        }
      });

      var Child = React.createClass({
        render: function() {
          return <GrandChild />;
        }
      });

      var instance1 =
        <TogglingComponent
          firstComponent={'div'}
          secondComponent={Child}
        />;
      var instance2 =
        <TogglingComponent
          firstComponent={Child}
          secondComponent={'div'}
        />;

      expect(function() {
        ReactTestUtils.renderIntoDocument(instance1);
      }).not.toThrow();
      expect(function() {
        ReactTestUtils.renderIntoDocument(instance2);
      }).not.toThrow();

      expect(console.log.argsForCall.length).toBe(4);
      expect(console.log.argsForCall[0][0].tagName).toBe('DIV');
      expect(console.log.argsForCall[1][0]).toBe(null);
      expect(console.log.argsForCall[2][0]).toBe(null);
      expect(console.log.argsForCall[3][0].tagName).toBe('DIV');
    }
  );

  it('works when switching components', function() {
    var assertions = 0;
    var Inner = React.createClass({
      render: function() {
        return <span />;
      },
      componentDidMount: function() {
        // Make sure the DOM node resolves properly even if we're replacing a
        // `null` component
        expect(this.getDOMNode()).not.toBe(null);
        assertions++;
      },
      componentWillUnmount: function() {
        // Even though we're getting replaced by `null`, we haven't been
        // replaced yet!
        expect(this.getDOMNode()).not.toBe(null);
        assertions++;
      }
    });
    var Wrapper = React.createClass({
      render: function() {
        return this.props.showInner ? <Inner /> : null;
      }
    });

    var el = document.createElement('div');
    var component;

    // Render the <Inner /> component...
    component = React.render(<Wrapper showInner={true} />, el);
    expect(component.getDOMNode()).not.toBe(null);

    // Switch to null...
    component = React.render(<Wrapper showInner={false} />, el);
    expect(component.getDOMNode()).toBe(null);

    // ...then switch back.
    component = React.render(<Wrapper showInner={true} />, el);
    expect(component.getDOMNode()).not.toBe(null);

    expect(assertions).toBe(3);
  });

  it('throws when rendering null at the top level', function() {
    // TODO: This should actually work since `null` is a valid ReactNode
    var div = document.createElement('div');
    expect(function() {
      React.render(null, div);
    }).toThrow(
      'Invariant Violation: React.render(): Invalid component element.'
    );
  });

  it('does not break when updating during mount', function() {
    var Child = React.createClass({
      componentDidMount() {
        this.props.onMount && this.props.onMount();
      },
      render() {
        if (!this.props.visible) {
          return null;
        }

        return <div>hello world</div>;
      }
    });

    var Parent = React.createClass({
      update() {
        this.forceUpdate();
      },
      render() {
        return (
          <div>
            <Child key="1" visible={false} />
            <Child key="0" visible={true} onMount={this.update} />
            <Child key="2" visible={false} />
          </div>
        );
      }
    });

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Parent/>)
    }).not.toThrow();
  });
});
