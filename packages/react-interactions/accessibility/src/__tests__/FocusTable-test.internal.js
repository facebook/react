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
let createFocusTable;
let tabbableScopeQuery;

describe('FocusTable', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    createFocusTable = require('../FocusTable').createFocusTable;
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

    function createFocusTableComponent() {
      const [FocusTable, FocusTableRow, FocusTableCell] = createFocusTable(
        tabbableScopeQuery,
      );

      return ({onKeyboardOut, wrapX, wrapY, allowModifiers}) => (
        <FocusTable
          onKeyboardOut={onKeyboardOut}
          wrapX={wrapX}
          wrapY={wrapY}
          allowModifiers={allowModifiers}>
          <table>
            <tbody>
              <FocusTableRow>
                <tr>
                  <FocusTableCell>
                    <td>
                      <button>A1</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>A2</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>A3</button>
                    </td>
                  </FocusTableCell>
                </tr>
              </FocusTableRow>
              <FocusTableRow>
                <tr>
                  <FocusTableCell>
                    <td>
                      <button>B1</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>B2</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>B3</button>
                    </td>
                  </FocusTableCell>
                </tr>
              </FocusTableRow>
              <FocusTableRow>
                <tr>
                  <FocusTableCell>
                    <td>
                      <button>C1</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>C2</button>
                    </td>
                  </FocusTableCell>
                  <FocusTableCell>
                    <td>
                      <button>C3</button>
                    </td>
                  </FocusTableCell>
                </tr>
              </FocusTableRow>
            </tbody>
          </table>
        </FocusTable>
      );
    }

    it('handles keyboard arrow operations with allowModifiers', () => {
      const Test = createFocusTableComponent();

      ReactDOM.render(<Test allowModifiers={true} />, container);
      const buttons = document.querySelectorAll('button');
      const a1 = createEventTarget(buttons[0]);
      a1.focus();
      a1.keydown({
        key: 'ArrowRight',
        altKey: true,
      });
      expect(document.activeElement.textContent).toBe('A2');
    });

    it('handles keyboard arrow operations', () => {
      const Test = createFocusTableComponent();

      ReactDOM.render(<Test />, container);
      const buttons = document.querySelectorAll('button');
      const a1 = createEventTarget(buttons[0]);
      a1.focus();
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A2');

      const a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('B2');

      let b2 = createEventTarget(document.activeElement);
      b2.keydown({
        key: 'ArrowLeft',
      });
      expect(document.activeElement.textContent).toBe('B1');

      const b1 = createEventTarget(document.activeElement);
      b1.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('C1');

      const c1 = createEventTarget(document.activeElement);
      c1.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('C1');
      c1.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('B1');
      // Should be a no-op due to modifier
      b2 = createEventTarget(document.activeElement);
      b2.keydown({
        key: 'ArrowUp',
        altKey: true,
      });
      b2 = createEventTarget(document.activeElement);
      expect(document.activeElement.textContent).toBe('B1');
    });

    it('handles keyboard arrow operations between nested tables', () => {
      const leftSidebarRef = React.createRef();
      const [
        MainFocusTable,
        MainFocusTableRow,
        MainFocusTableCell,
      ] = createFocusTable(tabbableScopeQuery);
      const SubFocusTable = createFocusTableComponent();
      const onKeyboardOut = jest.fn((direction, event) =>
        event.continuePropagation(),
      );

      function Test() {
        return (
          <MainFocusTable>
            <MainFocusTableRow>
              <div>
                <h1>Title</h1>
                <aside ref={leftSidebarRef}>
                  <h2>Left Sidebar</h2>
                  <MainFocusTableCell>
                    <SubFocusTable onKeyboardOut={onKeyboardOut} />
                  </MainFocusTableCell>
                </aside>
                <section>
                  <h2>Content</h2>
                  <MainFocusTableCell>
                    <SubFocusTable onKeyboardOut={onKeyboardOut} />
                  </MainFocusTableCell>
                </section>
                <aside>
                  <h2>Right Sidebar</h2>
                  <MainFocusTableCell>
                    <SubFocusTable onKeyboardOut={onKeyboardOut} />
                  </MainFocusTableCell>
                </aside>
              </div>
            </MainFocusTableRow>
          </MainFocusTable>
        );
      }

      ReactDOM.render(<Test />, container);
      const buttons = document.querySelectorAll('button');
      let a1 = createEventTarget(buttons[0]);
      a1.focus();
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A2');

      let a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A3');

      let a3 = createEventTarget(document.activeElement);
      a3.keydown({
        key: 'ArrowRight',
      });
      expect(onKeyboardOut).toHaveBeenCalledTimes(1);
      expect(document.activeElement.textContent).toBe('A1');

      a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A2');

      a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A3');

      a3 = createEventTarget(document.activeElement);
      a3.keydown({
        key: 'ArrowRight',
      });
      expect(onKeyboardOut).toHaveBeenCalledTimes(2);
      expect(document.activeElement.textContent).toBe('A1');

      a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A2');

      a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A3');

      a3 = createEventTarget(document.activeElement);
      a3.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A3');
    });

    it('handles nested tables correctly', () => {
      const customScopeQuery = (type, props) => {
        return type === 'input';
      };
      const [FocusTable, FocusRow, FocusCell] = createFocusTable(
        customScopeQuery,
      );
      const firstRef = React.createRef();

      function Test() {
        return (
          <FocusTable>
            <div>
              <FocusRow>
                <FocusCell>
                  <FocusTable>
                    <FocusRow>
                      <FocusCell>
                        <input
                          placeholder="Nested A1"
                          tabIndex={0}
                          ref={firstRef}
                        />
                      </FocusCell>
                      <FocusCell>
                        <input placeholder="Nested B1" tabIndex={0} />
                      </FocusCell>
                    </FocusRow>
                  </FocusTable>
                </FocusCell>
                <FocusCell>
                  <input placeholder="B1" tabIndex={-1} />
                </FocusCell>
                <FocusCell>
                  <input placeholder="C1" tabIndex={-1} />
                </FocusCell>
              </FocusRow>
            </div>
            <div>
              <FocusRow>
                <FocusCell>
                  <input placeholder="A2" tabIndex={-1} />
                </FocusCell>
                <FocusCell>
                  <input placeholder="B2" tabIndex={-1} />
                </FocusCell>
                <FocusCell>
                  <input placeholder="C1" tabIndex={-1} />
                </FocusCell>
              </FocusRow>
            </div>
          </FocusTable>
        );
      }

      ReactDOM.render(<Test />, container);
      firstRef.current.focus();

      const nestedA1 = createEventTarget(document.activeElement);
      nestedA1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('Nested B1');

      const nestedB1 = createEventTarget(document.activeElement);
      nestedB1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('B1');
    });

    it('handles keyboard arrow operations with X wrapping enabled', () => {
      const Test = createFocusTableComponent();

      ReactDOM.render(<Test wrapX={true} />, container);
      const buttons = document.querySelectorAll('button');
      let a1 = createEventTarget(buttons[0]);
      a1.focus();
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A2');

      const a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A3');

      const a3 = createEventTarget(document.activeElement);
      a3.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.textContent).toBe('A1');

      a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowLeft',
      });
      expect(document.activeElement.textContent).toBe('A3');
    });

    it('handles keyboard arrow operations with Y wrapping enabled', () => {
      const Test = createFocusTableComponent();

      ReactDOM.render(<Test wrapY={true} />, container);
      const buttons = document.querySelectorAll('button');
      let a1 = createEventTarget(buttons[0]);
      a1.focus();
      a1.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('B1');

      const a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('C1');

      const a3 = createEventTarget(document.activeElement);
      a3.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.textContent).toBe('A1');

      a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.textContent).toBe('C1');
    });

    it('handles keyboard arrow operations mixed with tabbing', () => {
      const [FocusTable, FocusRow, FocusCell] = createFocusTable(
        tabbableScopeQuery,
      );
      const beforeRef = React.createRef();
      const afterRef = React.createRef();

      function Test() {
        return (
          <>
            <input placeholder="Before" ref={beforeRef} />
            <FocusTable tabScopeQuery={tabbableScopeQuery}>
              <div>
                <FocusRow>
                  <FocusCell>
                    <input placeholder="A1" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="B1" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="C1" />
                  </FocusCell>
                </FocusRow>
              </div>
              <div>
                <FocusRow>
                  <FocusCell>
                    <input placeholder="A2" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="B2" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="C1" />
                  </FocusCell>
                </FocusRow>
              </div>
            </FocusTable>
            <input placeholder="After" ref={afterRef} />
          </>
        );
      }

      ReactDOM.render(<Test />, container);
      beforeRef.current.focus();

      expect(document.activeElement.placeholder).toBe('Before');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('A1');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('After');
      emulateBrowserTab(true);
      expect(document.activeElement.placeholder).toBe('A1');
      const a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('B1');
      emulateBrowserTab();
      expect(document.activeElement.placeholder).toBe('After');
      emulateBrowserTab(true);
      expect(document.activeElement.placeholder).toBe('B1');
    });

    it('handles keyboard arrow operations with colSpan', () => {
      const firstRef = React.createRef();
      const [FocusTable, FocusRow, FocusCell] = createFocusTable(
        tabbableScopeQuery,
      );

      function Test() {
        return (
          <>
            <FocusTable tabScopeQuery={tabbableScopeQuery}>
              <div>
                <FocusRow>
                  <FocusCell>
                    <input placeholder="A1" ref={firstRef} />
                  </FocusCell>
                  <FocusCell colSpan={2}>
                    <input placeholder="B1" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="C1" />
                  </FocusCell>
                </FocusRow>
              </div>
              <div>
                <FocusRow>
                  <FocusCell>
                    <input placeholder="A2" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="B2" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="C2" />
                  </FocusCell>
                  <FocusCell>
                    <input placeholder="D2" />
                  </FocusCell>
                </FocusRow>
              </div>
            </FocusTable>
          </>
        );
      }

      ReactDOM.render(<Test />, container);
      firstRef.current.focus();

      expect(document.activeElement.placeholder).toBe('A1');
      const a1 = createEventTarget(document.activeElement);
      a1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('B1');
      let b1 = createEventTarget(document.activeElement);
      b1.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('C1');
      let c1 = createEventTarget(document.activeElement);
      c1.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.placeholder).toBe('D2');
      let d2 = createEventTarget(document.activeElement);
      d2.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.placeholder).toBe('C1');
      c1 = createEventTarget(document.activeElement);
      c1.keydown({
        key: 'ArrowLeft',
      });
      expect(document.activeElement.placeholder).toBe('B1');
      b1 = createEventTarget(document.activeElement);
      b1.keydown({
        key: 'ArrowDown',
      });
      expect(document.activeElement.placeholder).toBe('B2');
      const b2 = createEventTarget(document.activeElement);
      b2.keydown({
        key: 'ArrowRight',
      });
      expect(document.activeElement.placeholder).toBe('C2');
      const c2 = createEventTarget(document.activeElement);
      c2.keydown({
        key: 'ArrowUp',
      });
      expect(document.activeElement.placeholder).toBe('B1');
    });
  });
});
