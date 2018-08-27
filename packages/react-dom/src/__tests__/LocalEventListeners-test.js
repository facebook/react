/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

describe('Local event listeners', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('triggers events local captured events from children without listeners', () => {
    const callback = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={callback}>
        <div id="middle" onScroll={callback}>
          <div id="bottom" />
        </div>
      </div>,
      container,
    );

    const event = document.createEvent('Event');

    event.initEvent('scroll', true, true);
    container.querySelector('#bottom').dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('can re-dispatch the same event from lower in the tree', () => {
    const callback = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={callback}>
        <div id="middle">
          <div id="bottom" />
        </div>
      </div>,
      container,
    );

    const event = document.createEvent('Event');
    const top = container.querySelector('#top');
    const middle = container.querySelector('#middle');
    const bottom = container.querySelector('#bottom');

    event.initEvent('scroll', true, true);

    top.dispatchEvent(event);
    middle.dispatchEvent(event);
    bottom.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('can re-dispatch the same event from higher in the tree', () => {
    const callback = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={callback}>
        <div id="middle">
          <div id="bottom" />
        </div>
      </div>,
      container,
    );

    const event = document.createEvent('Event');
    const top = container.querySelector('#top');
    const bottom = container.querySelector('#bottom');

    event.initEvent('scroll', true, true);

    bottom.dispatchEvent(event);
    top.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('can re-dispatch the same event from the same point in the tree', () => {
    const callback = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={callback}>
        <div id="middle">
          <div id="bottom" />
        </div>
      </div>,
      container,
    );

    const event = document.createEvent('Event');

    const bottom = container.querySelector('#bottom');

    event.initEvent('scroll', true, true);

    bottom.dispatchEvent(event);
    bottom.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not double dispatch events at the top leaf', () => {
    const top = jest.fn();
    const middle = jest.fn();
    const bottom = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={top}>
        <div id="middle" onScroll={middle}>
          <div id="bottom" onScroll={bottom} />
        </div>
      </div>,
      container,
    );

    const target = container.querySelector('#top');
    const event = document.createEvent('Event');

    event.initEvent('scroll', true, true);
    target.dispatchEvent(event);

    expect(top).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(0);
    expect(bottom).toHaveBeenCalledTimes(0);
  });

  it('does not double dispatch events at the middle leaf', () => {
    const top = jest.fn();
    const middle = jest.fn();
    const bottom = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={top}>
        <div id="middle" onScroll={middle}>
          <div id="bottom" onScroll={bottom} />
        </div>
      </div>,
      container,
    );

    const target = container.querySelector('#middle');
    const event = document.createEvent('Event');

    event.initEvent('scroll', true, true);
    target.dispatchEvent(event);

    expect(top).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(bottom).toHaveBeenCalledTimes(0);
  });

  it('does not double dispatch events at the deepest leaf', () => {
    const top = jest.fn();
    const middle = jest.fn();
    const bottom = jest.fn();

    ReactDOM.render(
      <div id="top" onScroll={top}>
        <div id="middle" onScroll={middle}>
          <div id="bottom" onScroll={bottom} />
        </div>
      </div>,
      container,
    );

    const target = container.querySelector('#bottom');
    const event = document.createEvent('Event');

    event.initEvent('scroll', true, true);
    target.dispatchEvent(event);

    expect(top).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(bottom).toHaveBeenCalledTimes(1);
  });
});
