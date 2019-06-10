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
let ReactDOM;
let FocusManager;
let FocusScope;

describe('FocusManager', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    let ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    FocusManager = ReactDOM.unstable_FocusManager;
    FocusScope = require('react-events/focus-scope'); // TODO: is this dependency bad??

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('focusNext', () => {
    it('focuses the next focusable element in the current scope', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusNext();
      expect(document.activeElement).toBe(divRef.current);
      FocusManager.focusNext();
      expect(document.activeElement).toBe(input2Ref.current);
      FocusManager.focusNext();
      expect(document.activeElement).toBe(input2Ref.current);
    });

    it('focuses the next focusable element in the current scope and wraps around', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusNext({wrap: true});
      expect(document.activeElement).toBe(divRef.current);
      FocusManager.focusNext({wrap: true});
      expect(document.activeElement).toBe(input2Ref.current);
      FocusManager.focusNext({wrap: true});
      expect(document.activeElement).toBe(inputRef.current);
    });

    it('focuses the next tabbable element in the current scope', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusNext({tabbable: true});
      expect(document.activeElement).toBe(input2Ref.current);
      FocusManager.focusNext({tabbable: true});
      expect(document.activeElement).toBe(input2Ref.current);
    });

    it('focuses the next tabbable element in the current scope and wraps around', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusNext({tabbable: true, wrap: true});
      expect(document.activeElement).toBe(input2Ref.current);
      FocusManager.focusNext({tabbable: true, wrap: true});
      expect(document.activeElement).toBe(inputRef.current);
    });

    it('focuses the next focusable element after the given element', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      FocusManager.focusNext({from: divRef.current});
      expect(document.activeElement).toBe(input2Ref.current);
    });
  });

  describe('focusPrevious', () => {
    it('focuses the previous focusable element in the current scope', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      input2Ref.current.focus();
      FocusManager.focusPrevious();
      expect(document.activeElement).toBe(divRef.current);
      FocusManager.focusPrevious();
      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusPrevious();
      expect(document.activeElement).toBe(inputRef.current);
    });

    it('focuses the previous focusable element in the current scope and wraps around', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      input2Ref.current.focus();
      FocusManager.focusPrevious({wrap: true});
      expect(document.activeElement).toBe(divRef.current);
      FocusManager.focusPrevious({wrap: true});
      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusPrevious({wrap: true});
      expect(document.activeElement).toBe(input2Ref.current);
    });

    it('focuses the previous tabbable element in the current scope', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      input2Ref.current.focus();
      FocusManager.focusPrevious({tabbable: true});
      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusPrevious({tabbable: true});
      expect(document.activeElement).toBe(inputRef.current);
    });

    it('focuses the previous tabbable element in the current scope and wraps around', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      input2Ref.current.focus();
      FocusManager.focusPrevious({tabbable: true, wrap: true});
      expect(document.activeElement).toBe(inputRef.current);
      FocusManager.focusPrevious({tabbable: true, wrap: true});
      expect(document.activeElement).toBe(input2Ref.current);
    });

    it('focuses the previous focusable element before the given element', () => {
      const inputRef = React.createRef();
      const divRef = React.createRef();
      const input2Ref = React.createRef();

      const SimpleFocusScope = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <div ref={divRef} tabIndex={-1} />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      ReactDOM.render(<SimpleFocusScope />, container);

      FocusManager.focusPrevious({from: divRef.current});
      expect(document.activeElement).toBe(inputRef.current);
    });
  });
});
