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

      return ({portrait}) => (
        <FocusList portrait={portrait}>
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
  });
});
