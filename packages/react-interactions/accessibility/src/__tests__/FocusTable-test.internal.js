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
let createFocusTable;
let TabbableScope;

describe('FocusTable', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    createFocusTable = require('../FocusTable').createFocusTable;
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

    function createFocusTableComponent() {
      const [FocusTable, FocusTableRow, FocusTableCell] = createFocusTable(
        TabbableScope,
      );

      return ({onKeyboardOut, id}) => (
        <FocusTable onKeyboardOut={onKeyboardOut} id={id}>
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

      const b2 = createEventTarget(document.activeElement);
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
    });

    it('handles keyboard arrow operations between tables', () => {
      const leftSidebarRef = React.createRef();
      const FocusTable = createFocusTableComponent();

      function Test() {
        return (
          <div>
            <h1>Title</h1>
            <aside ref={leftSidebarRef}>
              <h2>Left Sidebar</h2>
              <FocusTable
                id="left-sidebar"
                onKeyboardOut={(direction, focusTableByID) => {
                  if (direction === 'right') {
                    focusTableByID('content');
                  }
                }}
              />
            </aside>
            <section>
              <h2>Content</h2>
              <FocusTable
                id="content"
                onKeyboardOut={(direction, focusTableByID) => {
                  if (direction === 'right') {
                    focusTableByID('right-sidebar');
                  } else if (direction === 'left') {
                    focusTableByID('left-sidebar');
                  }
                }}
              />
            </section>
            <aside>
              <h2>Right Sidebar</h2>
              <FocusTable
                id="right-sidebar"
                onKeyboardOut={(direction, focusTableByID) => {
                  if (direction === 'left') {
                    focusTableByID('content');
                  }
                }}
              />
            </aside>
          </div>
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
      const CustomScope = React.unstable_createScope((type, props) => {
        return type === 'input';
      });
      const [FocusTable, FocusRow, FocusCell] = createFocusTable(CustomScope);
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
  });
});
