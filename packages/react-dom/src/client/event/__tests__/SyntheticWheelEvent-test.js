/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('SyntheticWheelEvent', () => {
  var React;
  var ReactDOM;
  var createDispatchWheelEvent;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    createDispatchWheelEvent = (component, options = {}) => {
      const event = new MouseEvent('wheel', {
        bubbles: true,
        cancelable: false,
        ...options,
      });
      const node = ReactDOM.findDOMNode(component);
      node.dispatchEvent(event);
    } 
  });

  it('should normalize properties from the Event interface', () => {
    var events = [];
    const container = document.createElement('div');
    var onWheel = event => {
      event.persist();
      events.push(event);
    }
    const component = ReactDOM.render(
      <div onWheel={onWheel} />,
      container
    );
    document.body.appendChild(container);
    createDispatchWheelEvent(component);

    expect(events[0].target).toBe(component);
    expect(events[0].type).toBe('wheel');

    document.body.removeChild(container);
  });

  it('should normalize properties from the MouseEvent interface', () => {
    var events = [];
    const container = document.createElement('div');
    var onWheel = event => {
      event.persist();
      events.push(event);
    }
    const component = ReactDOM.render(
      <div onWheel={onWheel} />,
      container
    );
    document.body.appendChild(container);
    createDispatchWheelEvent(component, {which: 2, button: 1});

    expect(events[0].button).toBe(1);

    document.body.removeChild(container);
  });

  it('should normalize properties from the WheelEvent interface', () => {
    var events = [];
    const container = document.createElement('div');
    var onWheel = event => {
      event.persist();
      events.push(event);
    }
    const component = ReactDOM.render(
      <div onWheel={onWheel} />,
      container
    );
    document.body.appendChild(container);

    createDispatchWheelEvent(component, {deltaX: 10, deltaY: -50});
    expect(events[0].deltaX).toBe(10);
    expect(events[0].deltaY).toBe(-50);
    
    createDispatchWheelEvent(component, {wheelDeltaX: -10, wheelDeltaY: 50});
    expect(events[1].deltaX).toBe(10);
    expect(events[1].deltaY).toBe(-50);
    
    document.body.removeChild(container);
  });

  it('should be able to `preventDefault` and `stopPropagation`', () => {
    var events = [];
    const container = document.createElement('div');
    var onWheel = event => {
      event.persist();
      events.push(event);
    }
    const component = ReactDOM.render(
      <div onWheel={onWheel} />,
      container
    );
    document.body.appendChild(container);

    createDispatchWheelEvent(component, {});
    expect(events[0].isDefaultPrevented()).toBe(false);
    events[0].preventDefault();
    expect(events[0].isDefaultPrevented()).toBe(true);
    
    createDispatchWheelEvent(component, {});
    expect(events[1].isPropagationStopped()).toBe(false);
    events[1].stopPropagation();
    expect(events[1].isPropagationStopped()).toBe(true);
    
    document.body.removeChild(container);
  });

  it('should be able to `persist`', () => {
    var events = [];
    const container = document.createElement('div');
    var onWheel = event => {
      events.push(event);
    }
    const component = ReactDOM.render(
      <div onWheel={onWheel} />,
      container
    );
    document.body.appendChild(container);

    createDispatchWheelEvent(component, {});
    expect(events[0].isPersistent()).toBe(false);
    events[0].persist();
    expect(events[0].isPersistent()).toBe(true);
    
    document.body.removeChild(container);
  });
});
