/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let React;
let ReactFeatureFlags;
let FocusContain;

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

describe('FocusContain', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    FocusContain = require('../FocusContain').FocusContain;
    React = require('react');
  });

  describe('ReactDOM', () => {
    let ReactDOM;
    let container;

    beforeEach(() => {
      ReactDOM = require('react-dom');
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
      container = null;
    });

    it('should work as expected with simple tab operations', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const butto2nRef = React.createRef();
      const divRef = React.createRef();

      const SimpleFocusScope = () => (
        <FocusContain>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={butto2nRef} />
        </FocusContain>
      );

      ReactDOM.render(<SimpleFocusScope />, container);
      inputRef.current.focus();
      document.activeElement.dispatchEvent(createTabForward());
      expect(document.activeElement).toBe(buttonRef.current);
      document.activeElement.dispatchEvent(createTabForward());
      expect(document.activeElement).toBe(divRef.current);
      document.activeElement.dispatchEvent(createTabForward());
      expect(document.activeElement).toBe(butto2nRef.current);
      document.activeElement.dispatchEvent(createTabBackward());
      expect(document.activeElement).toBe(divRef.current);
    });

    it('should work as expected with wrapping tab operations', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <FocusContain>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <input ref={input2Ref} tabIndex={-1} />
        </FocusContain>
      );

      ReactDOM.render(<SimpleFocusScope />, container);
      buttonRef.current.focus();
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
        <FocusContain>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusContain>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusContain>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusContain>
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
      // Focus is contained, so have to manually move it out
      button4Ref.current.focus();
      document.activeElement.dispatchEvent(createTabForward());
      expect(document.activeElement).toBe(buttonRef.current);
      document.activeElement.dispatchEvent(createTabBackward());
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
        <FocusContain>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusContain>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusContain>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusContain>
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
        <FocusContain>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </FocusContain>
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
});
