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
let ReactFeatureFlags;
let ReactDOM;

function dispatchClickEvent(element) {
  const event = document.createEvent('Event');
  event.initEvent('click', true, true);
  element.dispatchEvent(event);
}

describe('DOMModernPluginEventSystem', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableModernEventSystem = true;

    React = require('react');
    ReactDOM = require('react-dom');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('handle propagation of click events', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];
    const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Test() {
      return (
        <button
          ref={buttonRef}
          onClick={onClick}
          onClickCapture={onClickCapture}>
          <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
            Click me!
          </div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(onClickCapture).toHaveBeenCalledTimes(3);
    expect(log[2]).toEqual(['capture', buttonElement]);
    expect(log[3]).toEqual(['capture', divElement]);
    expect(log[4]).toEqual(['bubble', divElement]);
    expect(log[5]).toEqual(['bubble', buttonElement]);
  });

  it('handle propagation of focus events', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];
    const onFocus = jest.fn(e => log.push(['bubble', e.currentTarget]));
    const onFocusCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Test() {
      return (
        <button
          ref={buttonRef}
          onFocus={onFocus}
          onFocusCapture={onFocusCapture}>
          <div
            ref={divRef}
            onFocus={onFocus}
            onFocusCapture={onFocusCapture}
            tabIndex={0}>
            Click me!
          </div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    buttonElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
    divElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(3);
    expect(onFocusCapture).toHaveBeenCalledTimes(3);
    expect(log[2]).toEqual(['capture', buttonElement]);
    expect(log[3]).toEqual(['capture', divElement]);
    expect(log[4]).toEqual(['bubble', divElement]);
    expect(log[5]).toEqual(['bubble', buttonElement]);
  });

  it('handle propagation of click events correctly with FB primer', () => {
    ReactFeatureFlags.enableLegacyFBPrimerSupport = true;
    const aRef = React.createRef();

    const log = [];
    // Stop propagation throught the React system
    const onClick = jest.fn(e => e.stopPropagation());
    const onDivClick = jest.fn();

    function Test() {
      return (
        <div onClick={onDivClick}>
          <a ref={aRef} href="#" onClick={onClick} rel="dialog">
            Click me
          </a>
        </div>
      );
    }
    ReactDOM.render(<Test />, container);

    // Fake primer
    document.addEventListener('click', e => {
      if (e.target.rel === 'dialog') {
        log.push('primer');
      }
    });
    let aElement = aRef.current;
    dispatchClickEvent(aElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(log).toEqual(['primer']);
    expect(onDivClick).toHaveBeenCalledTimes(0);

    log.length = 0;
    // This isn't something that should be picked up by Primer
    function Test2() {
      return (
        <div onClick={onDivClick}>
          <a ref={aRef} href="#" onClick={onClick} rel="dialog-foo">
            Click me
          </a>
        </div>
      );
    }
    ReactDOM.render(<Test2 />, container);
    dispatchClickEvent(aElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(log).toEqual([]);
    expect(onDivClick).toHaveBeenCalledTimes(0);
  });
});
