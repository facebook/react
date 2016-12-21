/**
 * Copyright 2013-present, Facebook, Inc.
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
var ReactDOM;
var ReactDOMFeatureFlags;
var ReactTestUtils;
var ReactUpdates;

describe('ReactUpdates', () => {
  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactTestUtils = require('ReactTestUtils');
    ReactUpdates = require('ReactUpdates');
  });

  it('should batch state when updating state twice', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({x: 2});
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state when updating two different state keys', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0, y: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>({this.state.x}, {this.state.y})</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state and props together', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>({this.props.x}, {this.state.y})</div>;
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<Component x={0} />, container);
    expect(instance.props.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.render(<Component x={1} />, container);
      instance.setState({y: 2});
      expect(instance.props.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.props.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch parent/child state updates together', () => {
    var parentUpdateCount = 0;

    class Parent extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        parentUpdateCount++;
      }

      render() {
        return <div><Child ref="child" x={this.state.x} /></div>;
      }
    }

    var childUpdateCount = 0;

    class Child extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        childUpdateCount++;
      }

      render() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      child.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);
    expect(childUpdateCount).toBe(1);
  });

  it('should batch child/parent state updates together', () => {
    var parentUpdateCount = 0;

    class Parent extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        parentUpdateCount++;
      }

      render() {
        return <div><Child ref="child" x={this.state.x} /></div>;
      }
    }

    var childUpdateCount = 0;

    class Child extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        childUpdateCount++;
      }

      render() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      child.setState({y: 2});
      instance.setState({x: 1});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);

    // Batching reduces the number of updates here to 1.
    expect(childUpdateCount).toBe(1);
  });

  it('should support chained state updates', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var innerCallbackRun = false;
    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        instance.setState({x: 2}, function() {
          expect(this).toBe(instance);
          innerCallbackRun = true;
          expect(instance.state.x).toBe(2);
          expect(updateCount).toBe(2);
        });
        expect(instance.state.x).toBe(1);
        expect(updateCount).toBe(1);
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(innerCallbackRun).toBeTruthy();
    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(2);
  });

  it('should batch forceUpdate together', () => {
    var shouldUpdateCount = 0;
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      shouldComponentUpdate() {
        shouldUpdateCount++;
      }

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var callbacksRun = 0;
    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        callbacksRun++;
      });
      instance.forceUpdate(function() {
        callbacksRun++;
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(callbacksRun).toBe(2);
    // shouldComponentUpdate shouldn't be called since we're forcing
    expect(shouldUpdateCount).toBe(0);
    expect(instance.state.x).toBe(1);
    expect(updateCount).toBe(1);
  });

  it('should update children even if parent blocks updates', () => {
    var parentRenderCount = 0;
    var childRenderCount = 0;

    class Parent extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        parentRenderCount++;
        return <Child ref="child" />;
      }
    }

    class Child extends React.Component {
      render() {
        childRenderCount++;
        return <div />;
      }
    }

    expect(parentRenderCount).toBe(0);
    expect(childRenderCount).toBe(0);

    var instance = <Parent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(1);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
    });

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(1);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.refs.child.setState({x: 1});
    });

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(2);
  });

  it('should not reconcile children passed via props', () => {
    var numMiddleRenders = 0;
    var numBottomRenders = 0;

    class Top extends React.Component {
      render() {
        return <Middle><Bottom /></Middle>;
      }
    }

    class Middle extends React.Component {
      componentDidMount() {
        this.forceUpdate();
      }

      render() {
        numMiddleRenders++;
        return React.Children.only(this.props.children);
      }
    }

    class Bottom extends React.Component {
      render() {
        numBottomRenders++;
        return null;
      }
    }

    ReactTestUtils.renderIntoDocument(<Top />);
    expect(numMiddleRenders).toBe(2);
    expect(numBottomRenders).toBe(1);
  });

  it('should flow updates correctly', () => {
    var willUpdates = [];
    var didUpdates = [];

    var UpdateLoggingMixin = {
      componentWillUpdate: function() {
        willUpdates.push(this.constructor.displayName);
      },
      componentDidUpdate: function() {
        didUpdates.push(this.constructor.displayName);
      },
    };

    var Box = React.createClass({
      mixins: [UpdateLoggingMixin],

      render: function() {
        return <div ref="boxDiv">{this.props.children}</div>;
      },
    });

    var Child = React.createClass({
      mixins: [UpdateLoggingMixin],

      render: function() {
        return <span ref="span">child</span>;
      },
    });

    var Switcher = React.createClass({
      mixins: [UpdateLoggingMixin],

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
                display: this.state.tabKey === child.key ? '' : 'none',
              }}>
              {child}
            </div>
          </Box>
        );
      },
    });

    var App = React.createClass({
      mixins: [UpdateLoggingMixin],

      render: function() {
        return (
          <Switcher ref="switcher">
            <Child key="hello" ref="child" />
          </Switcher>
        );
      },
    });

    var root = <App />;
    root = ReactTestUtils.renderIntoDocument(root);

    function expectUpdates(desiredWillUpdates, desiredDidUpdates) {
      var i;
      for (i = 0; i < desiredWillUpdates; i++) {
        expect(willUpdates).toContain(desiredWillUpdates[i]);
      }
      for (i = 0; i < desiredDidUpdates; i++) {
        expect(didUpdates).toContain(desiredDidUpdates[i]);
      }
      willUpdates = [];
      didUpdates = [];
    }

    function triggerUpdate(c) {
      c.setState({x: 1});
    }

    function testUpdates(components, desiredWillUpdates, desiredDidUpdates) {
      var i;

      ReactDOM.unstable_batchedUpdates(function() {
        for (i = 0; i < components.length; i++) {
          triggerUpdate(components[i]);
        }
      });

      expectUpdates(desiredWillUpdates, desiredDidUpdates);

      // Try them in reverse order

      ReactDOM.unstable_batchedUpdates(function() {
        for (i = components.length - 1; i >= 0; i--) {
          triggerUpdate(components[i]);
        }
      });

      expectUpdates(desiredWillUpdates, desiredDidUpdates);
    }
    testUpdates(
      [root.refs.switcher.refs.box, root.refs.switcher],
      // Owner-child relationships have inverse will and did
      ['Switcher', 'Box'],
      ['Box', 'Switcher']
    );

    testUpdates(
      [root.refs.child, root.refs.switcher.refs.box],
      // Not owner-child so reconcile independently
      ['Box', 'Child'],
      ['Box', 'Child']
    );

    testUpdates(
      [root.refs.child, root.refs.switcher],
      // Switcher owns Box and Child, Box does not own Child
      ['Switcher', 'Box', 'Child'],
      ['Box', 'Switcher', 'Child']
    );
  });

  it('should share reconcile transaction across different roots', () => {
    if (ReactDOMFeatureFlags.useFiber) {
      return;
    }
    var ReconcileTransaction = ReactUpdates.ReactReconcileTransaction;
    spyOn(ReconcileTransaction, 'getPooled').and.callThrough();

    class Component extends React.Component {
      render() {
        return <div>{this.props.text}</div>;
      }
    }

    var containerA = document.createElement('div');
    var containerB = document.createElement('div');

    // Initial renders aren't batched together yet...
    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.render(<Component text="A1" />, containerA);
      ReactDOM.render(<Component text="B1" />, containerB);
    });
    expect(ReconcileTransaction.getPooled.calls.count()).toBe(2);

    // ...but updates are! Here only one more transaction is used, which means
    // we only have to initialize and close the wrappers once.
    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.render(<Component text="A2" />, containerA);
      ReactDOM.render(<Component text="B2" />, containerB);
    });
    expect(ReconcileTransaction.getPooled.calls.count()).toBe(3);
  });

  it('should queue mount-ready handlers across different roots', () => {
    // We'll define two components A and B, then update both of them. When A's
    // componentDidUpdate handlers is called, B's DOM should already have been
    // updated.

    var bContainer = document.createElement('div');

    var a;
    var b;

    var aUpdated = false;

    class A extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        expect(ReactDOM.findDOMNode(b).textContent).toBe('B1');
        aUpdated = true;
      }

      render() {
        var portal = null;
        // If we're using Fiber, we use Portals instead to achieve this.
        if (ReactDOMFeatureFlags.useFiber) {
          portal = ReactDOM.unstable_createPortal(
            <B ref={n => b = n} />,
            bContainer
          );
        }
        return <div>A{this.state.x}{portal}</div>;
      }
    }

    class B extends React.Component {
      state = {x: 0};

      render() {
        return <div>B{this.state.x}</div>;
      }
    }

    a = ReactTestUtils.renderIntoDocument(<A />);
    if (!ReactDOMFeatureFlags.useFiber) {
      ReactDOM.render(<B ref={n => b = n} />, bContainer);
    }

    ReactDOM.unstable_batchedUpdates(function() {
      a.setState({x: 1});
      b.setState({x: 1});
    });

    expect(aUpdated).toBe(true);
  });

  it('should flush updates in the correct order', () => {
    var updates = [];

    class Outer extends React.Component {
      state = {x: 0};

      render() {
        updates.push('Outer-render-' + this.state.x);
        return <div><Inner x={this.state.x} ref="inner" /></div>;
      }

      componentDidUpdate() {
        var x = this.state.x;
        updates.push('Outer-didUpdate-' + x);
        updates.push('Inner-setState-' + x);
        this.refs.inner.setState({x: x}, function() {
          updates.push('Inner-callback-' + x);
        });
      }
    }

    class Inner extends React.Component {
      state = {x: 0};

      render() {
        updates.push('Inner-render-' + this.props.x + '-' + this.state.x);
        return <div />;
      }

      componentDidUpdate() {
        updates.push('Inner-didUpdate-' + this.props.x + '-' + this.state.x);
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Outer />);

    updates.push('Outer-setState-1');
    instance.setState({x: 1}, function() {
      updates.push('Outer-callback-1');
      updates.push('Outer-setState-2');
      instance.setState({x: 2}, function() {
        updates.push('Outer-callback-2');
      });
    });

    /* eslint-disable indent */
    expect(updates).toEqual([
      'Outer-render-0',
        'Inner-render-0-0',

      'Outer-setState-1',
        'Outer-render-1',
          'Inner-render-1-0',
          'Inner-didUpdate-1-0',
        'Outer-didUpdate-1',
           // Happens in a batch, so don't re-render yet
          'Inner-setState-1',
        'Outer-callback-1',

        // Happens in a batch
        'Outer-setState-2',

        // Flush batched updates all at once
        'Outer-render-2',
          'Inner-render-2-1',
          'Inner-didUpdate-2-1',
          'Inner-callback-1',
        'Outer-didUpdate-2',
          'Inner-setState-2',
        'Outer-callback-2',
          'Inner-render-2-2',
          'Inner-didUpdate-2-2',
          'Inner-callback-2',
    ]);
    /* eslint-enable indent */
  });

  it('should flush updates in the correct order across roots', () => {
    var instances = [];
    var updates = [];

    class MockComponent extends React.Component {
      render() {
        updates.push(this.props.depth);
        return <div />;
      }

      componentDidMount() {
        instances.push(this);
        if (this.props.depth < this.props.count) {
          ReactDOM.render(
            <MockComponent
              depth={this.props.depth + 1}
              count={this.props.count}
            />,
            ReactDOM.findDOMNode(this)
          );
        }
      }
    }

    ReactTestUtils.renderIntoDocument(<MockComponent depth={0} count={2} />);

    expect(updates).toEqual([0, 1, 2]);

    ReactDOM.unstable_batchedUpdates(function() {
      // Simulate update on each component from top to bottom.
      instances.forEach(function(instance) {
        instance.forceUpdate();
      });
    });

    expect(updates).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('should queue nested updates', () => {
    // See https://github.com/facebook/react/issues/1147

    class X extends React.Component {
      state = {s: 0};

      render() {
        if (this.state.s === 0) {
          return (
            <div>
              <span>0</span>
            </div>
          );
        } else {
          return <div>1</div>;
        }
      }

      go = () => {
        this.setState({s: 1});
        this.setState({s: 0});
        this.setState({s: 1});
      };
    }

    class Y extends React.Component {
      render() {
        return (
          <div>
            <Z />
          </div>
        );
      }
    }

    class Z extends React.Component {
      render() {
        return <div />;
      }

      componentWillUpdate() {
        x.go();
      }
    }

    var x;
    var y;

    x = ReactTestUtils.renderIntoDocument(<X />);
    y = ReactTestUtils.renderIntoDocument(<Y />);
    expect(ReactDOM.findDOMNode(x).textContent).toBe('0');

    y.forceUpdate();
    expect(ReactDOM.findDOMNode(x).textContent).toBe('1');
  });

  it('should queue updates from during mount', () => {
    // See https://github.com/facebook/react/issues/1353
    var a;

    class A extends React.Component {
      state = {x: 0};

      componentWillMount() {
        a = this;
      }

      render() {
        return <div>A{this.state.x}</div>;
      }
    }

    class B extends React.Component {
      componentWillMount() {
        a.setState({x: 1});
      }

      render() {
        return <div />;
      }
    }

    ReactDOM.unstable_batchedUpdates(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <A />
          <B />
        </div>
      );
    });

    expect(a.state.x).toBe(1);
    expect(ReactDOM.findDOMNode(a).textContent).toBe('A1');
  });

  it('calls componentWillReceiveProps setState callback properly', () => {
    var callbackCount = 0;

    class A extends React.Component {
      state = {x: this.props.x};

      componentWillReceiveProps(nextProps) {
        var newX = nextProps.x;
        this.setState({x: newX}, function() {
          // State should have updated by the time this callback gets called
          expect(this.state.x).toBe(newX);
          callbackCount++;
        });
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<A x={1} />, container);
    ReactDOM.render(<A x={2} />, container);
    expect(callbackCount).toBe(1);
  });

  it('does not call render after a component as been deleted', () => {
    var renderCount = 0;
    var componentB = null;

    class B extends React.Component {
      state = {updates: 0};

      componentDidMount() {
        componentB = this;
      }

      render() {
        renderCount++;
        return <div />;
      }
    }

    class A extends React.Component {
      state = {showB: true};

      render() {
        return this.state.showB ? <B /> : <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    ReactDOM.unstable_batchedUpdates(function() {
      // B will have scheduled an update but the batching should ensure that its
      // update never fires.
      componentB.setState({updates: 1});
      component.setState({showB: false});
    });

    expect(renderCount).toBe(1);
  });

  it('marks top-level updates', () => {
    var ReactFeatureFlags = require('ReactFeatureFlags');

    class Foo extends React.Component {
      render() {
        return <Bar />;
      }
    }

    class Bar extends React.Component {
      render() {
        return <div />;
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Foo />, container);

    try {
      ReactFeatureFlags.logTopLevelRenders = true;
      spyOn(console, 'time');
      spyOn(console, 'timeEnd');

      ReactDOM.render(<Foo />, container);

      expect(console.time.calls.count()).toBe(1);
      expect(console.time.calls.argsFor(0)[0]).toBe('React update: Foo');
      expect(console.timeEnd.calls.count()).toBe(1);
      expect(console.timeEnd.calls.argsFor(0)[0]).toBe('React update: Foo');
    } finally {
      ReactFeatureFlags.logTopLevelRenders = false;
    }
  });

  it('throws in setState if the update callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    expect(() => component.setState({}, 'no')).toThrowError(
      'setState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: string.'
    );
    expect(() => component.setState({}, {})).toThrowError(
      'setState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Object.'
    );
    expect(() => component.setState({}, new Foo())).toThrowError(
      'setState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Foo (keys: a, b).'
    );
  });

  it('throws in replaceState if the update callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }
    var A = React.createClass({
      getInitialState: function() {
        return {};
      },
      render: function() {
        return <div />;
      },
    });
    var component = ReactTestUtils.renderIntoDocument(<A />);

    expect(() => component.replaceState({}, 'no')).toThrowError(
      'replaceState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: string.'
    );
    expect(() => component.replaceState({}, {})).toThrowError(
      'replaceState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Object.'
    );
    expect(() => component.replaceState({}, new Foo())).toThrowError(
      'replaceState(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Foo (keys: a, b).'
    );
  });

  it('throws in forceUpdate if the update callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    expect(() => component.forceUpdate('no')).toThrowError(
      'forceUpdate(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: string.'
    );
    expect(() => component.forceUpdate({})).toThrowError(
      'forceUpdate(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Object.'
    );
    expect(() => component.forceUpdate(new Foo())).toThrowError(
      'forceUpdate(...): Expected the last optional `callback` argument ' +
      'to be a function. Instead received: Foo (keys: a, b).'
    );
  });

  it('does not update one component twice in a batch (#2410)', () => {
    class Parent extends React.Component {
      getChild = () => {
        return this.refs.child;
      };

      render() {
        return <Child ref="child" />;
      }
    }

    var renderCount = 0;
    var postRenderCount = 0;
    var once = false;

    class Child extends React.Component {
      state = {updated: false};

      componentWillUpdate() {
        if (!once) {
          once = true;
          this.setState({updated: true});
        }
      }

      componentDidMount() {
        expect(renderCount).toBe(postRenderCount + 1);
        postRenderCount++;
      }

      componentDidUpdate() {
        expect(renderCount).toBe(postRenderCount + 1);
        postRenderCount++;
      }

      render() {
        expect(renderCount).toBe(postRenderCount);
        renderCount++;
        return <div />;
      }
    }

    var parent = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = parent.getChild();
    ReactDOM.unstable_batchedUpdates(function() {
      parent.forceUpdate();
      child.forceUpdate();
    });
  });

  it('does not update one component twice in a batch (#6371)', () => {
    var callbacks = [];
    function emitChange() {
      callbacks.forEach(c => c());
    }

    class App extends React.Component {
      constructor(props) {
        super(props);
        this.state = { showChild: true };
      }
      componentDidMount() {
        this.setState({ showChild: false });
      }
      render() {
        return (
          <div>
            <ForceUpdatesOnChange />
            {this.state.showChild && <EmitsChangeOnUnmount />}
          </div>
        );
      }
    }

    class EmitsChangeOnUnmount extends React.Component {
      componentWillUnmount() {
        emitChange();
      }
      render() {
        return null;
      }
    }

    class ForceUpdatesOnChange extends React.Component {
      componentDidMount() {
        this.onChange = () => this.forceUpdate();
        this.onChange();
        callbacks.push(this.onChange);
      }
      componentWillUnmount() {
        callbacks = callbacks.filter((c) => c !== this.onChange);
      }
      render() {
        return <div key={Math.random()} onClick={function() {}} />;
      }
    }

    ReactDOM.render(<App />, document.createElement('div'));
  });

  it('unstable_batchedUpdates should return value from a callback', () => {
    var result = ReactDOM.unstable_batchedUpdates(function() {
      return 42;
    });
    expect(result).toEqual(42);
  });

  it('unmounts and remounts a root in the same batch', () => {
    var container = document.createElement('div');
    ReactDOM.render(<span>a</span>, container);
    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.unmountComponentAtNode(container);
      ReactDOM.render(<span>b</span>, container);
    });
    expect(container.textContent).toBe('b');
  });
});
