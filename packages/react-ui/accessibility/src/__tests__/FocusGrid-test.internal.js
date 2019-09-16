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
let createFocusGrid;

describe('TabFocusController', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    createFocusGrid = require('../FocusGrid').createFocusGrid;
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
      const [
        FocusGridContainer,
        FocusGridRow,
        FocusGridCell,
      ] = createFocusGrid();
      const firstButtonRef = React.createRef();

      const Test = () => (
        <FocusGridContainer>
          <table>
            <tbody>
              <FocusGridRow>
                <tr>
                  <FocusGridCell>
                    <td>
                      <button ref={firstButtonRef}>A1</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>A2</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>A3</button>
                    </td>
                  </FocusGridCell>
                </tr>
              </FocusGridRow>
              <FocusGridRow>
                <tr>
                  <FocusGridCell>
                    <td>
                      <button>B1</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>B2</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>B3</button>
                    </td>
                  </FocusGridCell>
                </tr>
              </FocusGridRow>
              <FocusGridRow>
                <tr>
                  <FocusGridCell>
                    <td>
                      <button>C1</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>C2</button>
                    </td>
                  </FocusGridCell>
                  <FocusGridCell>
                    <td>
                      <button>C3</button>
                    </td>
                  </FocusGridCell>
                </tr>
              </FocusGridRow>
            </tbody>
          </table>
        </FocusGridContainer>
      );

      ReactDOM.render(<Test />, container);
      const a1 = createEventTarget(firstButtonRef.current);
      a1.focus();
      a1.keydown({
        key: 'RightArrow',
      });
      expect(document.activeElement.textContent).toBe('A2');

      const a2 = createEventTarget(document.activeElement);
      a2.keydown({
        key: 'DownArrow',
      });
      expect(document.activeElement.textContent).toBe('B2');

      const b2 = createEventTarget(document.activeElement);
      b2.keydown({
        key: 'LeftArrow',
      });
      expect(document.activeElement.textContent).toBe('B1');

      const b1 = createEventTarget(document.activeElement);
      b1.keydown({
        key: 'DownArrow',
      });
      expect(document.activeElement.textContent).toBe('C1');

      const c1 = createEventTarget(document.activeElement);
      c1.keydown({
        key: 'DownArrow',
      });
      expect(document.activeElement.textContent).toBe('C1');
      c1.keydown({
        key: 'UpArrow',
      });
      expect(document.activeElement.textContent).toBe('B1');
    });
  });
});
