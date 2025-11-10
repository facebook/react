/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let Activity;
let useState;
let ReactDOM;
let ReactDOMClient;
let act;

describe('ReactDOMActivity', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    Activity = React.Activity;
    useState = React.useState;
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // @gate enableActivity
  it(
    'hiding an Activity boundary also hides the direct children of any ' +
      'portals it contains, regardless of how deeply nested they are',
    async () => {
      const portalContainer = document.createElement('div');

      let setShow;
      function Accordion({children}) {
        const [shouldShow, _setShow] = useState(true);
        setShow = _setShow;
        return (
          <Activity mode={shouldShow ? 'visible' : 'hidden'}>
            {children}
          </Activity>
        );
      }

      function App({portalContents}) {
        return (
          <Accordion>
            <div>
              {ReactDOM.createPortal(
                <div>Portal contents</div>,
                portalContainer,
              )}
            </div>
          </Accordion>
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => root.render(<App />));
      expect(container.innerHTML).toBe('<div></div>');
      expect(portalContainer.innerHTML).toBe('<div>Portal contents</div>');

      // Hide the Activity boundary. Not only are the nearest DOM elements hidden,
      // but also the children of the nested portal contained within it.
      await act(() => setShow(false));
      expect(container.innerHTML).toBe('<div style="display: none;"></div>');
      expect(portalContainer.innerHTML).toBe(
        '<div style="display: none;">Portal contents</div>',
      );
    },
  );

  // @gate enableActivity
  it(
    'revealing an Activity boundary inside a portal does not reveal the ' +
      'portal contents if has a hidden Activity parent',
    async () => {
      const portalContainer = document.createElement('div');

      let setShow;
      function Accordion({children}) {
        const [shouldShow, _setShow] = useState(false);
        setShow = _setShow;
        return (
          <Activity mode={shouldShow ? 'visible' : 'hidden'}>
            {children}
          </Activity>
        );
      }

      function App({portalContents}) {
        return (
          <Activity mode="hidden">
            <div>
              {ReactDOM.createPortal(
                <Accordion>
                  <div>Portal contents</div>
                </Accordion>,
                portalContainer,
              )}
            </div>
          </Activity>
        );
      }

      // Start with both boundaries hidden.
      const root = ReactDOMClient.createRoot(container);
      await act(() => root.render(<App />));
      expect(container.innerHTML).toBe('<div style="display: none;"></div>');
      expect(portalContainer.innerHTML).toBe(
        '<div style="display: none;">Portal contents</div>',
      );

      // Reveal the inner Activity boundary. It should not reveal its children,
      // because there's a parent Activity boundary that is still hidden.
      await act(() => setShow(true));
      expect(container.innerHTML).toBe('<div style="display: none;"></div>');
      expect(portalContainer.innerHTML).toBe(
        '<div style="display: none;">Portal contents</div>',
      );
    },
  );
});
