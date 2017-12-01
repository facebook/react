/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactTestUtils;
let ReactBrowserEventEmitter;
let LISTENER = jest.fn();

let ParentComponent;
let createInitialInstance;
let getChildInstance;
let getParentInstance;
let updateInstance;

describe('ReactBrowserEventEmitter', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER.mockClear();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactBrowserEventEmitter = require('react-dom/src/events/ReactBrowserEventEmitter');
    ReactTestUtils = require('react-dom/test-utils');

    let container = document.createElement('div');

    class Child extends React.PureComponent {
      render() {
        return <div {...this.props} />;
      }
    }

    ParentComponent = class Parent extends React.Component {
      render() {
        return (
          <div {...this.props.parentProps}>
            <Child {...this.props.childProps} />
          </div>
        );
      }
    };

    /**
     * alway initial the new instance for child component to bind click listener
     * @param {}
     * @return {Component Instance} initial instance
     */
    createInitialInstance = () => {
      const initialInstance = ReactDOM.render(
        <ParentComponent parentProps={{}} childProps={{onClick: LISTENER}} />,
        container,
      );
      const child = getChildInstance(initialInstance);
      expect(child.props.onClick).toBe(LISTENER);

      return initialInstance;
    };

    /**
     * update and rerender the same instance
     * @param {object} parentProps - props for parent component to update
     * @param {object} childProps - props for child component to update
     */
    updateInstance = ({parentProps, childProps}) => {
      return ReactDOM.render(
        <ParentComponent parentProps={parentProps} childProps={childProps} />,
        container,
      );
    };

    /**
     * helper to find the specified instance
     * @param {Component Instance} inst - main instance
     * @return {Component Instance} Child instance
     */
    getChildInstance = inst => {
      return ReactTestUtils.findRenderedComponentWithType(inst, Child);
    };

    /**
     * helper to find the specified instance
     * @param {Component Instance} inst - main instance
     * @return {Component Instance} Parent instance
     */
    getParentInstance = inst => {
      return ReactTestUtils.findRenderedComponentWithType(
        inst,
        ParentComponent,
      );
    };
  });

  it('should store a listener correctly', () => {
    createInitialInstance();
    const inst = updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    const child = getChildInstance(inst);
    expect(child.props.onClick).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    createInitialInstance();
    const inst = updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    const child = getChildInstance(inst);
    expect(child.props.onClick).toBe(LISTENER);
  });

  it('should clear all handlers when asked to', () => {
    createInitialInstance();
    const inst = updateInstance({
      parentProps: {},
      childProps: {},
    });
    const child = getChildInstance(inst);
    expect(child.props.onClick).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', () => {
    const inst = createInitialInstance();
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  /**
   * used ../events/ReactBrowserEventEmitter by origin test,
   * change it to use the public modules react-dom/src/events/ReactBrowserEventEmitter
   * to instead.
   */
  it('should not invoke handlers if ReactBrowserEventEmitter is disabled', () => {
    const inst = createInitialInstance();
    ReactBrowserEventEmitter.setEnabled(false);
    const child = getChildInstance(inst);
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(child));
    expect(LISTENER.mock.calls.length).toBe(0);
    ReactBrowserEventEmitter.setEnabled(true);
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(child));
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should bubble simply', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall() {
      calls = calls.concat('child is call');
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
  });

  it('should bubble to the right handler after an update', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function parentUpdateCall() {
      calls = calls.concat('parentUpdate is call');
    }
    function childCall() {
      calls = calls.concat('child is call');
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
    calls = [];
    updateInstance({
      parentProps: {
        onClick: parentUpdateCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parentUpdate is call');
  });

  it('should continue bubbling if an error is thrown', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall() {
      calls = calls.concat('child is call');
      throw new Error('Handler interrupted');
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    expect(() =>
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child)),
    ).toThrow();
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
  });

  it('should set currentTarget', () => {
    let targets = [];
    function parentCall(event) {
      targets = targets.concat(event.currentTarget);
    }
    function childCall(event) {
      targets = targets.concat(event.currentTarget);
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    const parent = getParentInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(targets.length).toBe(2);
    expect(targets[0]).toBe(ReactDOM.findDOMNode(child));
    expect(targets[1]).toBe(ReactDOM.findDOMNode(parent));
  });

  /**
   * when call stopPropagation only call child,
   * don't bubbling
   */
  it('should support stopPropagation()', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall(event) {
      calls = calls.concat('child is call');
      event.stopPropagation();
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should support overriding .isPropagationStopped()', () => {
    let calls = [];
    function parentCall(event) {
      calls = calls.concat('parent is call');
    }
    function childCall(event) {
      calls = calls.concat('child is call');
      // This stops React bubbling but avoids touching the native event
      event.isPropagationStopped = () => true;
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should stop after first dispatch if stopPropagation', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall(event) {
      calls = calls.concat('child is call');
      event.stopPropagation();
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should not stopPropagation if false is returned', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall(event) {
      calls = calls.concat('child is call');
      return false;
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    spyOnDev(console, 'error');
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
    if (__DEV__) {
      expect(console.error.calls.count()).toEqual(0);
    }
  });

  /**
   * The entire event registration state of the world should be "locked-in" at
   * the time the event occurs. This is to resolve many edge cases that come
   * about from a listener on a lower-in-DOM node causing structural changes at
   * places higher in the DOM. If this lower-in-DOM node causes new content to
   * be rendered at a place higher-in-DOM, we need to be careful not to invoke
   * these new listeners.
   */

  it('should invoke handlers that were removed while bubbling', () => {
    let parentMockFn = jest.fn();
    function parentCall() {
      parentMockFn();
    }
    /**
     * click child and remove parent onClick event
     */
    function childCall() {
      updateInstance({
        parentProps: {},
        childProps: {
          onClick: childCall,
        },
      });
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(parentMockFn.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', () => {
    let parentMockFn = jest.fn();
    function parentCall() {
      parentMockFn();
    }
    /**
     * click child and update parent onClick event,
     * but don't bubbling parent click event
     */
    function childCall() {
      updateInstance({
        parentProps: {
          onClick: parentCall,
        },
        childProps: {
          onClick: childCall,
        },
      });
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(child));
    expect(parentMockFn.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', () => {
    let targets = [];
    function childCall(event) {
      targets = targets.concat(event.currentTarget);
    }
    const inst = createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onMouseEnter: childCall,
      },
    });
    const child = getChildInstance(inst);
    ReactTestUtils.Simulate.mouseEnter(ReactDOM.findDOMNode(child));
    expect(targets[0]).toBe(ReactDOM.findDOMNode(child));
  });

  it('should listen to events only once', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    ReactBrowserEventEmitter.listenTo('onClick', document);
    ReactBrowserEventEmitter.listenTo('onClick', document);
    expect(EventTarget.prototype.addEventListener.calls.count()).toBe(1);
  });

  it('should work with event plugins without dependencies', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    ReactBrowserEventEmitter.listenTo('onClick', document);
    expect(EventTarget.prototype.addEventListener.calls.argsFor(0)[0]).toBe(
      'click',
    );
  });

  it('should work with event plugins with dependencies', () => {
    //   spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    //   ReactBrowserEventEmitter.listenTo('onClick', document);
    //   var setEventListeners = [];
    //   var listenCalls = EventTarget.prototype.addEventListener.calls.allArgs();
    //   for (var i = 0; i < listenCalls.length; i++) {
    //     setEventListeners.push(listenCalls[i][1]);
    //   }
    //   var module = EventPluginRegistry.registrationNameModules['onChange'];
    //   var dependencies = module.eventTypes.change.dependencies;
    //   expect(setEventListeners.length).toEqual(dependencies.length);
    //   for (i = 0; i < setEventListeners.length; i++) {
    //     expect(dependencies.indexOf(setEventListeners[i])).toBeTruthy();
    //   }
  });
});
