/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createEventTarget} from 'react-interactions/events/src/dom/testing-library';

let React;
let ReactFeatureFlags;
let FocusManager;
let FocusControl;

describe('FocusManager', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    FocusManager = require('../FocusManager').default;
    FocusControl = require('../FocusControl');
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

    it('handles tab operations by default', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const divRef = React.createRef();

      const Test = () => (
        <FocusManager>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button2Ref} />
        </FocusManager>
      );

      ReactDOM.render(<Test />, container);
      inputRef.current.focus();
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(divRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(divRef.current);
    });

    it('handles autoFocus', () => {
      const buttonRef = React.createRef();

      const Test = () => (
        <FocusManager autoFocus={true}>
          <input tabIndex={-1} />
          <button ref={buttonRef} />
        </FocusManager>
      );

      ReactDOM.render(<Test />, container);
      expect(document.activeElement).toBe(buttonRef.current);
    });

    it('handles restoreFocus', () => {
      const difRef = React.createRef();
      const buttonRef = React.createRef();

      const Test = ({flag}) => {
        return (
          <div ref={difRef} tabIndex={0}>
            {flag ? (
              <FocusManager autoFocus={true} restoreFocus={true}>
                <button ref={buttonRef} />
              </FocusManager>
            ) : null}
          </div>
        );
      };

      ReactDOM.render(<Test flag={false} />, container);
      difRef.current.focus();
      expect(document.activeElement).toBe(difRef.current);
      ReactDOM.render(<Test flag={true} />, container);
      expect(document.activeElement).toBe(buttonRef.current);
      ReactDOM.render(<Test flag={false} />, container);
      expect(document.activeElement).toBe(difRef.current);
    });

    it('handles containFocus', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const input3Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();

      const Test = () => (
        <div>
          <FocusManager containFocus={true}>
            <input ref={inputRef} tabIndex={-1} />
            <button ref={buttonRef} id={1} />
            <button ref={button2Ref} id={2} />
            <input ref={input2Ref} tabIndex={-1} />
          </FocusManager>
          <input ref={input3Ref} />
        </div>
      );

      ReactDOM.render(<Test />, container);
      buttonRef.current.focus();
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button2Ref.current);
      // Focus should be restored to the contained area
      const rAF = window.requestAnimationFrame;
      window.requestAnimationFrame = x => setTimeout(x);
      input3Ref.current.focus();
      jest.advanceTimersByTime(1);
      window.requestAnimationFrame = rAF;
      expect(document.activeElement).toBe(button2Ref.current);
    });

    it('works with nested FocusManagers', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <FocusManager>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusManager>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusManager>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusManager>
      );

      ReactDOM.render(<Test />, container);
      buttonRef.current.focus();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button4Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button2Ref.current);
    });

    it('handles containFocus (nested FocusManagers)', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <FocusManager>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusManager containFocus={true}>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusManager>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusManager>
      );

      ReactDOM.render(<Test />, container);
      buttonRef.current.focus();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
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

      const Test = () => (
        <FocusManager>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </FocusManager>
      );

      ReactDOM.render(<Test />, container);
      buttonRef.current.focus();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button4Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button2Ref.current);
    });

    it('allows for imperative tab focus control using FocusControl', () => {
      const firstFocusControllerRef = React.createRef();
      const secondFocusControllerRef = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const divRef = React.createRef();

      const Test = () => (
        <div>
          <FocusManager ref={firstFocusControllerRef}>
            <input tabIndex={-1} />
            <button ref={buttonRef} />
            <button ref={button2Ref} />
            <input tabIndex={-1} />
          </FocusManager>
          <FocusManager ref={secondFocusControllerRef}>
            <input tabIndex={-1} />
            <div ref={divRef} tabIndex={0} />
          </FocusManager>
        </div>
      );

      ReactDOM.render(<Test />, container);
      const firstFocusController = firstFocusControllerRef.current;
      const secondFocusController = secondFocusControllerRef.current;

      FocusControl.focusFirst(firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);
      FocusControl.focusNext(firstFocusController);
      expect(document.activeElement).toBe(button2Ref.current);
      FocusControl.focusPrevious(firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);

      const nextController = FocusControl.getNextScope(firstFocusController);
      expect(nextController).toBe(secondFocusController);
      FocusControl.focusFirst(nextController);
      expect(document.activeElement).toBe(divRef.current);

      const previousController = FocusControl.getPreviousScope(nextController);
      expect(previousController).toBe(firstFocusController);
      FocusControl.focusFirst(previousController);
      expect(document.activeElement).toBe(buttonRef.current);
    });
  });
});
