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
let FocusManager;
let tabbableScopeQuery;

describe('FocusManager', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    FocusManager = require('../FocusManager');
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

    it('allows for imperative tab focus control with a scope', () => {
      const firstFocusControllerRef = React.createRef();
      const secondFocusControllerRef = React.createRef();
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const divRef = React.createRef();
      const TestScope = React.unstable_createScope();

      const Test = () => (
        <div>
          <TestScope ref={firstFocusControllerRef}>
            <input tabIndex={-1} />
            <button ref={buttonRef} />
            <button ref={button2Ref} />
            <input tabIndex={-1} />
          </TestScope>
          <TestScope ref={secondFocusControllerRef}>
            <input tabIndex={-1} />
            <div ref={divRef} tabIndex={0} />
          </TestScope>
        </div>
      );

      ReactDOM.render(<Test />, container);
      const firstFocusController = firstFocusControllerRef.current;
      const secondFocusController = secondFocusControllerRef.current;

      FocusManager.focusFirst(tabbableScopeQuery, firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);
      FocusManager.focusNext(tabbableScopeQuery, firstFocusController);
      expect(document.activeElement).toBe(button2Ref.current);
      FocusManager.focusPrevious(tabbableScopeQuery, firstFocusController);
      expect(document.activeElement).toBe(buttonRef.current);

      const nextController = FocusManager.getNextScope(firstFocusController);
      expect(nextController).toBe(secondFocusController);
      FocusManager.focusFirst(tabbableScopeQuery, nextController);
      expect(document.activeElement).toBe(divRef.current);

      const previousController = FocusManager.getPreviousScope(nextController);
      expect(previousController).toBe(firstFocusController);
      FocusManager.focusFirst(tabbableScopeQuery, previousController);
      expect(document.activeElement).toBe(buttonRef.current);
    });
  });
});
