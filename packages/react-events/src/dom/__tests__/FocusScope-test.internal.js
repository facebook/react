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
let FocusScopeResponder;

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
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    FocusScopeResponder = require('react-events/focus-scope')
      .FocusScopeResponder;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  it('should work as expected with autofocus', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const butto2nRef = React.createRef();
    const divRef = React.createRef();

    const SimpleFocusScope = () => (
      <div responders={<FocusScopeResponder autoFocus={true} />}>
        <input ref={inputRef} />
        <button ref={buttonRef} />
        <div ref={divRef} tabIndex={0} />
        <input ref={input2Ref} tabIndex={-1} />
        <button ref={butto2nRef} />
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    expect(document.activeElement).toBe(inputRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(divRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(butto2nRef.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(divRef.current);
  });

  it('should work as expected with autoFocus and contain', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const button2Ref = React.createRef();

    const SimpleFocusScope = () => (
      <div responders={<FocusScopeResponder autoFocus={true} contain={true} />}>
        <input ref={inputRef} tabIndex={-1} />
        <button ref={buttonRef} id={1} />
        <button ref={button2Ref} id={2} />
        <input ref={input2Ref} tabIndex={-1} />
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button2Ref.current);
  });

  it('should work as expected when nested', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const button2Ref = React.createRef();
    const button3Ref = React.createRef();
    const button4Ref = React.createRef();

    const SimpleFocusScope = () => (
      <div responders={<FocusScopeResponder />}>
        <input ref={inputRef} tabIndex={-1} />
        <button ref={buttonRef} id={1} />
        <div responders={<FocusScopeResponder />}>
          <button ref={button2Ref} id={2} />
          <button ref={button3Ref} id={3} />
        </div>
        <input ref={input2Ref} tabIndex={-1} />
        <button ref={button4Ref} id={4} />
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    buttonRef.current.focus();
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button4Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button2Ref.current);
  });

  it('should work as expected when nested with scope that is contained', () => {
    const inputRef = React.createRef();
    const input2Ref = React.createRef();
    const buttonRef = React.createRef();
    const button2Ref = React.createRef();
    const button3Ref = React.createRef();
    const button4Ref = React.createRef();

    const SimpleFocusScope = () => (
      <div responders={<FocusScopeResponder />}>
        <input ref={inputRef} tabIndex={-1} />
        <button ref={buttonRef} id={1} />
        <div responders={<FocusScopeResponder contain={true} />}>
          <button ref={button2Ref} id={2} />
          <button ref={button3Ref} id={3} />
        </div>
        <input ref={input2Ref} tabIndex={-1} />
        <button ref={button4Ref} id={4} />
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    buttonRef.current.focus();
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button2Ref.current);
  });

  it('should work as expected with suspense fallbacks', () => {
    const buttonRef = React.createRef();
    const button2Ref = React.createRef();
    const button3Ref = React.createRef();
    const button4Ref = React.createRef();
    const button5Ref = React.createRef();

    function SuspendedComponent() {
      throw new Promise(() => {
        // Never resolve
      });
    }

    function Component() {
      return (
        <React.Fragment>
          <button ref={button5Ref} id={5} />
          <SuspendedComponent />
        </React.Fragment>
      );
    }

    const SimpleFocusScope = () => (
      <div responders={<FocusScopeResponder />}>
        <button ref={buttonRef} id={1} />
        <button ref={button2Ref} id={2} />
        <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
          <Component />
        </React.Suspense>
        <button ref={button4Ref} id={4} />
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    buttonRef.current.focus();
    expect(document.activeElement).toBe(buttonRef.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button2Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabForward());
    expect(document.activeElement).toBe(button4Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button3Ref.current);
    document.activeElement.dispatchEvent(createTabBackward());
    expect(document.activeElement).toBe(button2Ref.current);
  });
});
