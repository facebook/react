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
let LISTENER = jest.fn();

let container;

let createInitialInstance;

let updateInstance;

let CHILD, PARENT;

describe('ReactBrowserEventEmitter', () => {
  beforeEach(() => {
    jest.resetModules();
    LISTENER.mockClear();

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
            {this.props.childProps.isUnmount ? null : (
              <Child ref={n => (CHILD = n)} {...this.props.childProps} />
            )}
          </div>
        );
      }
    }

    /**
     * alway initial the new instance for child component to bind click listener
     * @param {}
     * @return {Component Instance} initial instance
     */
    createInitialInstance = () => {
      const initialInstance = ReactDOM.render(
        <Parent parentProps={{}} childProps={{onClick: LISTENER}} />,
        container,
      );
      expect(CHILD.props.onClick).toBe(LISTENER);

      return initialInstance;
    };

    /**
     * update and rerender the same instance
     * @param {object} parentProps - props for parent component to update
     * @param {object} childProps - props for child component to update
     */
    updateInstance = ({parentProps, childProps}) => {
      return ReactDOM.render(
        <Parent
          ref={n => (PARENT = n)}
          parentProps={parentProps}
          childProps={childProps}
        />,
        container,
      );
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    CHILD = null;
    PARENT = null;
    jest.resetModules();
  });

  it('should store a listener correctly', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    expect(CHILD.props.onClick).toBe(LISTENER);
  });

  it('should retrieve a listener correctly', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
      },
    });
    expect(CHILD.props.onClick).toBe(LISTENER);
  });

  it('should clear all handlers when asked to', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {},
    });
    expect(CHILD.props.onClick).toBe(undefined);
  });

  it('should invoke a simple handler registered on a node', () => {
    createInitialInstance();
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should not invoke handlers if ReactBrowserEventEmitter is disabled', () => {
    const willUnmountCalls = jest.fn();
    class UnmountComponent extends React.Component {
      constructor() {
        super();
        this.node = null;
      }
      // when mount trigger event onClick
      componentDidMount() {
        this.node.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      // Don't trigger event in willmount
      componentWillUnmount() {
        willUnmountCalls();
        this.node.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      render() {
        return <div ref={node => (this.node = node)} onClick={LISTENER} />;
      }
    }
    class App extends React.Component {
      render() {
        return this.props.isUnmount ? null : <UnmountComponent />;
      }
    }

    // mount first
    ReactDOM.render(<App />, container);

    // re-render
    ReactDOM.render(<App isUnmount />, container);
    expect(LISTENER.mock.calls.length).toBe(1);
    expect(willUnmountCalls.mock.calls.length).toBe(1);

    // re-render
    ReactDOM.render(<App />, container);
    expect(LISTENER.mock.calls.length).toBe(2);
  });

  it('should bubble simply', () => {
    let calls = [];
    function parentCall() {
      calls = calls.concat('parent is call');
    }
    function childCall() {
      calls = calls.concat('child is call');
    }
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
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
      targets = targets.concat(event.currentTarget);
    }
    function childCall(event) {
      targets = targets.concat(event.currentTarget);
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
    let node = ReactDOM.findDOMNode(CHILD);
    let parentNode = ReactDOM.findDOMNode(PARENT);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(targets.length).toBe(2);
    expect(targets[0]).toBe(node);
    expect(targets[1]).toBe(parentNode);
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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    createInitialInstance();
    updateInstance({
      parentProps: {
        onClick: parentCall,
      },
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe('child is call');
    expect(calls[1]).toBe('parent is call');
    if (__DEV__) {
      expect(console.error.calls.count()).toEqual(0);
    }
  });

  // /**
  //  * The entire event registration state of the world should be "locked-in" at
  //  * the time the event occurs. This is to resolve many edge cases that come
  //  * about from a listener on a lower-in-DOM node causing structural changes at
  //  * places higher in the DOM. If this lower-in-DOM node causes new content to
  //  * be rendered at a place higher-in-DOM, we need to be careful not to invoke
  //  * these new listeners.
  //  */

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
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
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
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: childCall,
      },
    });
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(parentMockFn.mock.calls.length).toBe(0);
  });

  it('should have mouse enter simulated by test utils', () => {
    let targets = [];
    function childCall(event) {
      targets = targets.concat(event.currentTarget);
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
    let node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(event);

    expect(targets[0]).toBe(node);
  });

  // /**
  //  * add twice onClick props in Child component,
  //  * but should only called once.
  //  */
  it('should listen to events only once', () => {
    createInitialInstance();
    updateInstance({
      parentProps: {},
      childProps: {
        onClick: LISTENER,
        onClick: LISTENER,
      },
    });
    const node = ReactDOM.findDOMNode(CHILD);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(LISTENER.mock.calls.length).toBe(1);
  });

  it('should work with event plugins without dependencies', () => {
    spyOnDevAndProd(EventTarget.prototype, 'addEventListener');
    // const SimpleComponent = () => <div onClick={LISTENER} />;
    // ReactDOM.render(<SimpleComponent />, container);
    document.addEventListener('click', LISTENER);
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
