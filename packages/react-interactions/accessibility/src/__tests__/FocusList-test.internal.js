/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  createEventTarget,
  emulateBrowserTab,
} from 'react-interactions/events/src/dom/testing-library';

let React;
let ReactFeatureFlags;
let createFocusList;
let TabbableScope;

describe('FocusList', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    createFocusList = require('../FocusList').createFocusList;
    TabbableScope = require('../TabbableScope').default;
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

    function createFocusListComponent() {
      const [FocusList, FocusItem] = createFocusList(TabbableScope);

      return ({portrait, wrap}) => (
        <FocusList portrait={portrait} wrap={wrap}>
          <ul>
            <FocusItem>
              <li tabIndex={0}>Item 1</li>
            </FocusItem>
            <FocusItem>
              <li tabIndex={0}>Item 2</li>
            </FocusItem>
            <FocusItem>
              <li tabIndex={0}>Item 3</li>
            </FocusItem>
          </ul>
        </FocusList>
      );
    }

    it('handles keyboard arrow operations (portrait)', () => {
      const Test = createFocusListComponent();

      ReactDOM.render(<Test portrait={true} />, container);
      const listItems = document.querySelectorAll('li');
      const firstListItem = createEventTarget(listItems[0]);
      firstListItem.focus();
      firstListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondListItem = createEventTarget(document.activeElement);
      secondListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdListItem = createEventTarget(document.activeElement);
      thirdListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdListItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdListItem.keydown({
        key: 'ArrowLeft',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations (landscape)', () => {
      const Test = createFocusListComponent();

      ReactDOM.render(<Test portrait={false} />, container);
      const listItems = document.querySelectorAll('li');
      const firstListItem = createEventTarget(listItems[0]);
      firstListItem.focus();
      firstListItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondListItem = createEventTarget(document.activeElement);
      secondListItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdListItem = createEventTarget(document.activeElement);
      thirdListItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdListItem.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations (portrait) with wrapping enabled', () => {
      const Test = createFocusListComponent();

      ReactDOM.render(<Test portrait={true} wrap={true} />, container);
      const listItems = document.querySelectorAll('li');
      let firstListItem = createEventTarget(listItems[0]);
      firstListItem.focus();
      firstListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondListItem = createEventTarget(document.activeElement);
      secondListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdListItem = createEventTarget(document.activeElement);
      thirdListItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 1');

      firstListItem = createEventTarget(document.activeElement);
      firstListItem.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations mixed with tabbing', () => {
      const [FocusList, FocusItem] = createFocusList(TabbableScope);
      const beforeRef = React.createRef();
      const afterRef = React.createRef();

      function Test() {
        return (
          <>
            <input placeholder="Before" ref={beforeRef} />
            <FocusList tabScope={TabbableScope} portrait={true}>
              <ul>
                <FocusItem>
                  <li>
                    <input placeholder="A" />
                  </li>
                </FocusItem>
                <FocusItem>
                  <li>
                    <input placeholder="B" />
                  </li>
                </FocusItem>
                <FocusItem>
                  <li>
                    <input placeholder="C" />
                  </li>
                </FocusItem>
                <FocusItem>
                  <li>
                    <input placeholder="D" />
                  </li>
                </FocusItem>
                <FocusItem>
                  <li>
                    <input placeholder="E" />
                  </li>
                </FocusItem>
                <FocusItem>
                  <li>
                    <input placeholder="F" />
                  </li>
                </FocusItem>
              </ul>
            </FocusList>
            <input placeholder="After" ref={afterRef} />
          </>
        );
      }

      ReactDOM.render(<Test />, container);
      beforeRef.current.focus();

      expect(document.activeElement.placeholder).toBe('Before');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('A');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('After');
      emulateBrowserTab(true);
      expect(document.activeElement.placeholder).toBe('A');
      const a = createEventTarget(document.activeElement);
      a.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.placeholder).toBe('B');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('After');
      emulateBrowserTab(true);
      expect(document.activeElement.placeholder).toBe('B');
    });
  });
});
