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
let useFocusManager;

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
    FocusScope = require('react-events/focus-scope').FocusScope;
    useFocusManager = require('react-events/focus-scope').useFocusManager;

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
      <div>
        <FocusScope autoFocus={true} contain={true}>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <input ref={input2Ref} tabIndex={-1} />
        </FocusScope>
      </div>
    );

    ReactDOM.render(<SimpleFocusScope />, container);
    expect(document.activeElement).toBe(inputRef.current);
    document.activeElement.dispatchEvent(createTabForward());
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
      <div>
        <FocusScope>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusScope>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusScope>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusScope>
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
      <div>
        <FocusScope>
          <input ref={inputRef} tabIndex={-1} />
          <button ref={buttonRef} id={1} />
          <FocusScope contain={true}>
            <button ref={button2Ref} id={2} />
            <button ref={button3Ref} id={3} />
          </FocusScope>
          <input ref={input2Ref} tabIndex={-1} />
          <button ref={button4Ref} id={4} />
        </FocusScope>
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
      <div>
        <FocusScope>
          <button ref={buttonRef} id={1} />
          <button ref={button2Ref} id={2} />
          <React.Suspense fallback={<button ref={button3Ref} id={3} />}>
            <Component />
          </React.Suspense>
          <button ref={button4Ref} id={4} />
        </FocusScope>
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

  describe('useFocusManager', () => {
    it('returns a focus manager', () => {
      let focusManager;

      const ScopeParent = () => (
        <FocusScope autoFocus={true} contain={true}>
          <Child />
        </FocusScope>
      );

      const Child = () => {
        focusManager = useFocusManager();
        return null;
      };

      ReactDOM.render(<ScopeParent />, container);

      expect(focusManager).toHaveProperty('focusPrevious');
      expect(focusManager).toHaveProperty('focusNext');
    });

    it('throws if not inside a focus scope', () => {
      const Child = () => {
        useFocusManager();
        return null;
      };

      expect(() => {
        ReactDOM.render(<Child />, container);
      }).toThrow(
        'Tried to call useFocusManager outside of a FocusScope subtree.',
      );
    });

    it('can be used to move focus', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const divRef = React.createRef();

      const ScopeParent = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <Child />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      const Child = () => {
        let focusManager = useFocusManager();
        return (
          <div ref={divRef} onClick={() => focusManager.focusNext()}>
            Focus Next
          </div>
        );
      };

      ReactDOM.render(<ScopeParent />, container);

      expect(document.activeElement).toBe(inputRef.current);
      divRef.current.click();
      expect(document.activeElement).toBe(input2Ref.current);
    });

    it('throws when trying to use a focus manager method on an unmounted component', () => {
      const inputRef = React.createRef();
      const input2Ref = React.createRef();
      const ScopeParent = () => (
        <div>
          <FocusScope autoFocus={true} contain={true}>
            <input ref={inputRef} />
            <span />
            <Child />
            <span />
            <input ref={input2Ref} />
          </FocusScope>
        </div>
      );

      const Child = () => {
        let focusManager = useFocusManager();
        focusManager.focusNext();
        return null;
      };

      expect(() => {
        ReactDOM.render(<ScopeParent />, container);
      }).toThrow(
        'Attempt to use a focus manager method on an unmounted component.',
      );
    });

    describe('focusNext', () => {
      it('focuses the next focusable element in the current scope', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusNext();
        expect(document.activeElement).toBe(divRef.current);
        focusManager.focusNext();
        expect(document.activeElement).toBe(input2Ref.current);
        focusManager.focusNext();
        expect(document.activeElement).toBe(input2Ref.current);
      });

      it('focuses the next focusable element in the current scope and wraps around', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusNext({wrap: true});
        expect(document.activeElement).toBe(divRef.current);
        focusManager.focusNext({wrap: true});
        expect(document.activeElement).toBe(input2Ref.current);
        focusManager.focusNext({wrap: true});
        expect(document.activeElement).toBe(inputRef.current);
      });

      it('focuses the next tabbable element in the current scope', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusNext({tabbable: true});
        expect(document.activeElement).toBe(input2Ref.current);
        focusManager.focusNext({tabbable: true});
        expect(document.activeElement).toBe(input2Ref.current);
      });

      it('focuses the next tabbable element in the current scope and wraps around', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusNext({tabbable: true, wrap: true});
        expect(document.activeElement).toBe(input2Ref.current);
        focusManager.focusNext({tabbable: true, wrap: true});
        expect(document.activeElement).toBe(inputRef.current);
      });

      it('focuses the next focusable element after the given element', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        focusManager.focusNext({from: divRef.current});
        expect(document.activeElement).toBe(input2Ref.current);
      });
    });

    describe('focusPrevious', () => {
      it('focuses the previous focusable element in the current scope', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        input2Ref.current.focus();
        focusManager.focusPrevious();
        expect(document.activeElement).toBe(divRef.current);
        focusManager.focusPrevious();
        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusPrevious();
        expect(document.activeElement).toBe(inputRef.current);
      });

      it('focuses the previous focusable element in the current scope and wraps around', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        input2Ref.current.focus();
        focusManager.focusPrevious({wrap: true});
        expect(document.activeElement).toBe(divRef.current);
        focusManager.focusPrevious({wrap: true});
        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusPrevious({wrap: true});
        expect(document.activeElement).toBe(input2Ref.current);
      });

      it('focuses the previous tabbable element in the current scope', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        input2Ref.current.focus();
        focusManager.focusPrevious({tabbable: true});
        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusPrevious({tabbable: true});
        expect(document.activeElement).toBe(inputRef.current);
      });

      it('focuses the previous tabbable element in the current scope and wraps around', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        input2Ref.current.focus();
        focusManager.focusPrevious({tabbable: true, wrap: true});
        expect(document.activeElement).toBe(inputRef.current);
        focusManager.focusPrevious({tabbable: true, wrap: true});
        expect(document.activeElement).toBe(input2Ref.current);
      });

      it('focuses the previous focusable element before the given element', () => {
        const inputRef = React.createRef();
        const divRef = React.createRef();
        const input2Ref = React.createRef();
        let focusManager;

        const ScopeParent = () => (
          <div>
            <FocusScope autoFocus={true} contain={true}>
              <Child />
            </FocusScope>
          </div>
        );

        const Child = () => {
          focusManager = useFocusManager();
          return (
            <div>
              <input ref={inputRef} />
              <span />
              <div ref={divRef} tabIndex={-1} />
              <span />
              <input ref={input2Ref} />
            </div>
          );
        };

        ReactDOM.render(<ScopeParent />, container);

        focusManager.focusPrevious({from: divRef.current});
        expect(document.activeElement).toBe(inputRef.current);
      });
    });
  });
});
