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
let FocusScope;

const createTabForward = type => {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  return event;
};

const createTabBackward = type => {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  return event;
};

describe('FocusScope event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    FocusScope = require('react-events/FocusScope');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('when using a simple focus scope with autofocus', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const butto2nRef = React.createRef();
    const divRef = React.createRef();

    const SimpleFocusScope = () => (
      <div>
        <FocusScope autoFocus={true}>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={butto2nRef} />
        </FocusScope>
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    expect(document.activeElement).toBe(inputRef.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(divRef.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(butto2nRef.current);
    document.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(divRef.current);
  });

  it('when using a simple focus scope with autofocus and trapping', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const button2Ref = React.createRef();

    const SimpleFocusScope = () => (
      <div>
        <FocusScope autoFocus={true} trap={true}>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <input ref={input2Ref} tabIndex={-1} />
        </FocusScope>
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    expect(document.activeElement).toBe(buttonRef.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button2Ref.current);
  });
});
