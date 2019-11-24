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
let FocusContain;
let tabbableScopeQuery;

describe('FocusContain', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    FocusContain = require('../FocusContain').default;
    tabbableScopeQuery = require('../TabbableScopeQuery').default;
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
        <FocusContain scopeQuery={tabbableScopeQuery}>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button2Ref} />
        </FocusContain>
      );

      ReactDOM.render(<Test />, container);
      expect(document.activeElement).toBe(inputRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(divRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(button2Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(divRef.current);
    });

    it('handles focus containment', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const input3Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();

      const Test = () => (
        <div>
          <FocusContain scopeQuery={tabbableScopeQuery}>
            <input ref={inputRef} tabIndex={-1} />
            <button ref={buttonRef} id={1} />
            <button ref={button2Ref} id={2} />
            <input ref={input2Ref} tabIndex={-1} />
          </FocusContain>
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

    it('works with a disabled nested FocusContain', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <FocusContain scopeQuery={tabbableScopeQuery}>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusContain scopeQuery={tabbableScopeQuery} disabled={true}>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusContain>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusContain>
      );

      ReactDOM.render(<Test />, container);
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

    it('works with enabled nested FocusContain', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <FocusContain scopeQuery={tabbableScopeQuery}>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusContain scopeQuery={tabbableScopeQuery} disabled={false}>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusContain>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusContain>
      );

      ReactDOM.render(<Test />, container);
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
        <FocusContain scopeQuery={tabbableScopeQuery}>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </FocusContain>
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
  });
});
