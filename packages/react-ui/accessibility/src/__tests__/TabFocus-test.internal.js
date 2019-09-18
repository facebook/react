/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createEventTarget} from 'react-ui/events/src/dom/testing-library';

let React;
let ReactFeatureFlags;
let TabFocusController;
let ReactTabFocus;

describe('TabFocusController', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    ReactTabFocus = require('../TabFocus');
    TabFocusController = ReactTabFocus.TabFocusController;
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

    it('handles tab operations', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const butto2nRef = React.createRef();
      const divRef = React.createRef();

      const Test = () => (
        <TabFocusController>
          <input ref={inputRef} />
          <button ref={buttonRef} />
          <div ref={divRef} tabIndex={0} />
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={butto2nRef} />
        </TabFocusController>
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

    it('handles tab operations with containment', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();

      const Test = () => (
        <TabFocusController contain={true}>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <input ref={input2Ref} tabIndex={-1} />
        </TabFocusController>
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

    it('handles tab operations when controllers are nested', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <TabFocusController>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <TabFocusController>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </TabFocusController>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </TabFocusController>
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

    it('handles tab operations when controllers are nested with containment', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const button3Ref = React.createRef();
      const button4Ref = React.createRef();

      const Test = () => (
        <TabFocusController>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <TabFocusController contain={true}>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </TabFocusController>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </TabFocusController>
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
        <TabFocusController>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </TabFocusController>
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

    it('allows for imperative tab focus control', () => {
      const firstFocusControllerRef = React.createRef();
      const secondFocusControllerRef = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const divRef = React.createRef();

      const Test = () => (
        <div>
          <TabFocusController ref={firstFocusControllerRef}>
            <input tabIndex={-1} />
            <button ref={buttonRef} />
            <button ref={button2Ref} />
            <input tabIndex={-1} />
          </TabFocusController>
          <TabFocusController ref={secondFocusControllerRef}>
            <input tabIndex={-1} />
            <div ref={divRef} tabIndex={0} />
          </TabFocusController>
        </div>
      );

      ReactDOM.render(<Test />, container);
      const firstFocusController = firstFocusControllerRef.current;
      const secondFocusController = secondFocusControllerRef.current;

      ReactTabFocus.focusFirst(firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);
      ReactTabFocus.focusNext(firstFocusController);
      expect(document.activeElement).toBe(button2Ref.current);
      ReactTabFocus.focusPrevious(firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);

      const nextController = ReactTabFocus.getNextController(
        firstFocusController,
      );
      expect(nextController).toBe(secondFocusController);
      ReactTabFocus.focusNext(nextController);
      expect(document.activeElement).toBe(divRef.current);

      const previousController = ReactTabFocus.getPreviousController(
        nextController,
      );
      expect(previousController).toBe(firstFocusController);
      ReactTabFocus.focusNext(previousController);
      expect(document.activeElement).toBe(buttonRef.current);
    });
  });
});
