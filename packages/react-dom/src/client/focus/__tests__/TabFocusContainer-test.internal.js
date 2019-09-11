/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createEventTarget} from 'react-events/src/dom/testing-library';

let React;
let ReactFeatureFlags;
let TabFocusContainer;

describe('TabFocusContainer', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    TabFocusContainer = require('../TabFocusContainer').TabFocusContainer;
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

      const Test = () => (
        <TabFocusContainer>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={butto2nRef} />
        </TabFocusContainer>
      );

      ReactDOM.render(<Test />, container);
      inputRef.current.focus();
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(divRef.current);
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(butto2nRef.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(divRef.current);
    });

    it('should work as expected with wrapping tab operations', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();

      const Test = () => (
        <TabFocusContainer>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <input ref={input2Ref} tabIndex={-1} />
        </TabFocusContainer>
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
    });

    it('should work as expected when nested', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <TabFocusContainer>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <TabFocusContainer>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </TabFocusContainer>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </TabFocusContainer>
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
      // Focus is contained, so have to manually move it out
      button4Ref.current.focus();
      createEventTarget(document.activeElement).tabNext();
      expect(document.activeElement).toBe(buttonRef.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button4Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button3Ref.current);
      createEventTarget(document.activeElement).tabPrevious();
      expect(document.activeElement).toBe(button2Ref.current);
    });

    it('should work as expected when nested with scope that is contained', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <TabFocusContainer>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <TabFocusContainer>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </TabFocusContainer>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </TabFocusContainer>
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
        <TabFocusContainer>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </TabFocusContainer>
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
