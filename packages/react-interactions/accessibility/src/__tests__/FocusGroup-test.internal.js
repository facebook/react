/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createEventTarget} from 'react-interactions/events/src/dom/testing-library';
import {emulateBrowserTab} from '../shared/emulateBrowserTab';

let React;
let ReactFeatureFlags;
let createFocusGroup;
let tabbableScopeQuery;

describe('FocusGroup', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    createFocusGroup = require('../FocusGroup').createFocusGroup;
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

    function createFocusGroupComponent() {
      const [FocusGroup, FocusItem] = createFocusGroup(tabbableScopeQuery);

      return ({portrait, wrap, allowModifiers}) => (
        <FocusGroup
          portrait={portrait}
          wrap={wrap}
          allowModifiers={allowModifiers}>
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
        </FocusGroup>
      );
    }

    it('handles keyboard arrow operations (portrait)', () => {
      const Test = createFocusGroupComponent();

      ReactDOM.render(<Test portrait={true} />, container);
      const groupItems = document.querySelectorAll('li');
      const firstGroupItem = createEventTarget(groupItems[0]);
      firstGroupItem.focus();
      firstGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondGroupItem = createEventTarget(document.activeElement);
      secondGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdGroupItem = createEventTarget(document.activeElement);
      thirdGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdGroupItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdGroupItem.keydown({
        key: 'ArrowLeft',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      // Should be a no-op due to modifier
      thirdGroupItem.keydown({
        key: 'ArrowUp',
        altKey: true,
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations (landscape)', () => {
      const Test = createFocusGroupComponent();

      ReactDOM.render(<Test portrait={false} />, container);
      const GroupItems = document.querySelectorAll('li');
      const firstGroupItem = createEventTarget(GroupItems[0]);
      firstGroupItem.focus();
      firstGroupItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondGroupItem = createEventTarget(document.activeElement);
      secondGroupItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdGroupItem = createEventTarget(document.activeElement);
      thirdGroupItem.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdGroupItem.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
      thirdGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations (portrait) with wrapping enabled', () => {
      const Test = createFocusGroupComponent();

      ReactDOM.render(<Test portrait={true} wrap={true} />, container);
      const GroupItems = document.querySelectorAll('li');
      let firstGroupItem = createEventTarget(GroupItems[0]);
      firstGroupItem.focus();
      firstGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 2');

      const secondGroupItem = createEventTarget(document.activeElement);
      secondGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 3');

      const thirdGroupItem = createEventTarget(document.activeElement);
      thirdGroupItem.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('Item 1');

      firstGroupItem = createEventTarget(document.activeElement);
      firstGroupItem.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('Item 3');
    });

    it('handles keyboard arrow operations (portrait) with allowModifiers', () => {
      const Test = createFocusGroupComponent();

      ReactDOM.render(
        <Test portrait={true} allowModifiers={true} />,
        container,
      );
      const GroupItems = document.querySelectorAll('li');
      let firstGroupItem = createEventTarget(GroupItems[0]);
      firstGroupItem.focus();
      firstGroupItem.keydown({
        key: 'ArrowDown',
        altKey: true,
      });
      expect(document.activeElement.textContent).toBe('Item 2');
    });

    it('handles keyboard arrow operations mixed with tabbing', () => {
      const [FocusGroup, FocusItem] = createFocusGroup(tabbableScopeQuery);
      const beforeRef = React.createRef();
      const afterRef = React.createRef();

      function Test() {
        return (
          <>
            <input placeholder="Before" ref={beforeRef} />
            <FocusGroup tabScopeQuery={tabbableScopeQuery} portrait={true}>
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
            </FocusGroup>
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
