/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
let LISTENER;

let container;

let createInitialInstance;

let updateInstance;

let childRef;

describe('ReactBrowserEventEmitter', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER = jest.fn();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');

    container = document.createElement('div');
    document.body.appendChild(container);

    class Child extends React.PureComponent {
      render() {
        return <div {...this.props} />;
      }
    }

    class Parent extends React.Component {
      render() {
        return (
          <div {...this.props.parentProps}>
            <Child ref={n => (childRef = n)} {...this.props.childProps} />
          </div>
        );
      }
    }

    createInitialInstance = () => {
      const initialInstance = ReactDOM.render(
        <Parent parentProps={{}} childProps={{onClick: LISTENER}} />,
        container,
      );
      expect(childRef.props.onClick).toBe(LISTENER);

      return initialInstance;
    };

    updateInstance = ({parentProps, childProps}) => {
      return ReactDOM.render(
        <Parent parentProps={parentProps} childProps={childProps} />,
        container,
      );
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    childRef = null;
  });

  it('should store a listener correctly', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    expect(childRef.props.onClick).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    expect(childRef.props.onClick).toBe(LISTENER);
  });

  it('should clear all handlers when asked to', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {},
    });
    expect(childRef.props.onClick).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', () => {
    createInitialInstance();
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(LISTENER).toHaveBeenCalledTimes(1);
  });

  it('should not invoke handlers if ReactBrowserEventEmitter is disabled', () => {
    const willUnmountCalls = jest.fn();
    class UnmountComponent extends React.Component {
      constructor() {
        super();
        this.node = null;
      }
      // The ReactBrowserEventEmitter is disabled when WillUnmount lifecycle work
      componentWillUnmount() {
        willUnmountCalls();
        this.node.click();
      }
      render() {
        return <div ref={node => (this.node = node)} />;
      }
    }
    class App extends React.Component {
      render() {
        return this.props.isUnmount ? null : <UnmountComponent />;
      }
    }

    ReactDOM.render(<App />, container);

    ReactDOM.render(<App isUnmount />, container);
    expect(LISTENER).toHaveBeenCalledTimes(0);
  });

  it('should bubble simply', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function childCall() {
      calls.push('child is call');
    }
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
  });

  it('should bubble to the right handler after an update', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function parentUpdateCall() {
      calls.push('parentUpdate is call');
    }
    function childCall() {
      calls.push('child is call');
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
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
    node.click();
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parentUpdate is call');
  });

  it('should continue bubbling if an error is thrown', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function childCall() {
      calls.push('child is call');
      throw new Error('Handler interrupted');
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    expect(() => ReactTestUtils.Simulate.click(node)).toThrowError(
      'Handler interrupted',
    );
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
  });

  it('should set currentTarget', () => {
    let targets = [];
    function parentCall(event) {
      targets.push(event.currentTarget);
    }
    function childCall(event) {
      targets.push(event.currentTarget);
    }
    const parent = createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    let parentNode = ReactDOM.findDOMNode(parent);
    node.click();
    expect(targets.length).toBe(2);
    expect(targets[0]).toBe(node);
    expect(targets[1]).toBe(parentNode);
  });

  it('should support stopPropagation()', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function childCall(event) {
      calls.push('child is call');
      event.stopPropagation();
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should support overriding .isPropagationStopped()', () => {
    let calls = [];
    function parentCall(event) {
      calls.push('parent is call');
    }
    function childCall(event) {
      calls.push('child is call');
      // This stops React bubbling but avoids touching the native event
      event.isPropagationStopped = () => true;
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should stop after first dispatch if stopPropagation', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function childCall(event) {
      calls.push('child is call');
      event.stopPropagation();
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe('child is call');
  });

  it('should not stopPropagation if false is returned', () => {
    let calls = [];
    function parentCall() {
      calls.push('parent is call');
    }
    function childCall(event) {
      calls.push('child is call');
      return false;
    }
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    spyOnDev(console, 'error');
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
    if (__DEV__) {
      expect(console.error.calls.count()).toEqual(0);
    }
  });

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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(parentMockFn.mock.calls.length).toBe(1);
  });

  it('should not invoke newly inserted handlers while bubbling', () => {
    let parentMockFn = jest.fn();
    function parentCall() {
      parentMockFn();
    }

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
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(parentMockFn.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', () => {
    let targets = [];
    function childCall(event) {
      targets.push(event.currentTarget);
    }
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onMouseEnter: childCall,
      },
    });
    const event = document.createEvent('Event');
    event.initEvent('mouseover', true, true);
    let node = ReactDOM.findDOMNode(childRef);
    node.dispatchEvent(event);

    expect(targets[0]).toBe(node);
  });

  it('should listen to events only once', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
        onClick: LISTENER,
      },
    });
    const node = ReactDOM.findDOMNode(childRef);
    node.click();
    expect(LISTENER).toHaveBeenCalledTimes(1);
  });

  it('should work with event plugins without dependencies', () => {
    const node = ReactDOM.render(<button onClick={LISTENER} />, container);
    node.click();
    expect(LISTENER).toHaveBeenCalledTimes(1);
  });

  it('should work with event plugins with dependencies', () => {
    /**
     * test input
     * ref: https://github.com/facebook/react/issues/10135#issuecomment-314441175
     *
     * TOP_CLICK,
     * TOP_FOCUS,
     * TOP_INPUT,
     * TOP_KEY_DOWN,
     * TOP_KEY_UP,
     * TOP_SELECTION_CHANGE,
     *
     */
    function setNativeValue(element, value) {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        'value',
      ).set;
      if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else {
        valueSetter.call(element, value);
      }
    }
    const input = ReactDOM.render(
      <input
        type="text"
        onChange={LISTENER}
        onFocus={LISTENER}
        onBlur={LISTENER}
        onInput={LISTENER}
        onKeyDown={LISTENER}
        onKeyUp={LISTENER}
      />,
      container,
    );
    setNativeValue(input, ' ');
    input.dispatchEvent(new Event('change', {bubbles: true}));
    input.dispatchEvent(new Event('blur', {bubbles: true}));
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('keydown', {bubbles: true}));
    input.dispatchEvent(new Event('keyup', {bubbles: true}));
    input.focus();

    expect(LISTENER).toHaveBeenCalledTimes(6);
  });
});
