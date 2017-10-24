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
  var ReactTestUtils;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should normalize properties from the Event interface', () => {
    let events = [];
    const container = document.createElement('div');
    const component = ReactDOM.render(
      <div
        onWheel={e => {
          e.persist();
          events.push(e);
        }}
      />,
      container
    );
    ReactTestUtils.SimulateNative.wheel(component, {});
    expect(events[0].target).toBe(component);
    expect(events[0].type).toBe(undefined);
  });

  it('should normalize properties from the MouseEvent interface', () => {
    let events = [];
    const container = document.createElement('div');
    const component = ReactDOM.render(
      <div
        onWheel={e => {
          e.persist();
          events.push(e);
        }}
      />,
      container
    );

    ReactTestUtils.SimulateNative.wheel(component, {which: 2, button: 1});
    expect(events[0].button).toBe(1);
  });

  it('should normalize properties from the WheelEvent interface', () => {
    let events = [];
    const container = document.createElement('div');
    const component = ReactDOM.render(
      <div
        onWheel={e => {
          e.persist();
          events.push(e);
        }}
      />,
      container
    );

    ReactTestUtils.SimulateNative.wheel(component, {deltaX: 10, deltaY: -50});
    expect(events[0].deltaX).toBe(10);
    expect(events[0].deltaY).toBe(-50);
    
    ReactTestUtils.SimulateNative.wheel(component, {wheelDeltaX: -10, wheelDeltaY: 50});
    expect(events[1].deltaX).toBe(10);
    expect(events[1].deltaY).toBe(-50);
  });

  it('should be able to `preventDefault` and `stopPropagation`', () => {
    let events = [];
    const container = document.createElement('div');
    const component = ReactDOM.render(
      <div
        onWheel={e => {
          e.persist();
          events.push(e);
        }}
      />,
      container
    );
    
    ReactTestUtils.SimulateNative.wheel(component, {});
    expect(events[0].isDefaultPrevented()).toBe(false);
    events[0].preventDefault();
    expect(events[0].isDefaultPrevented()).toBe(true);
    
    ReactTestUtils.SimulateNative.wheel(component, {});
    expect(events[1].isPropagationStopped()).toBe(false);
    events[1].stopPropagation();
    expect(events[1].isPropagationStopped()).toBe(true);
  });

  it('should be able to `persist`', () => {
    let events = [];
    const container = document.createElement('div');
    const component = ReactDOM.render(
      <div
        onWheel={e => {
          events.push(e);
        }}
      />,
      container
    );
    
    ReactTestUtils.SimulateNative.wheel(component, {});
    expect(events[0].isPersistent()).toBe(false);
    events[0].persist();
    expect(events[0].isPersistent()).toBe(true);
  });
});
