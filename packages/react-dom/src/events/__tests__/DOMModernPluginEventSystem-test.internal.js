/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let ReactDOMServer;
let Scheduler;
let ReactTestUtils;

function dispatchEvent(element, type) {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  element.dispatchEvent(event);
}

function dispatchClickEvent(element) {
  dispatchEvent(element, 'click');
}

const eventListenersToClear = [];

function startNativeEventListenerClearDown() {
  const nativeWindowEventListener = window.addEventListener;
  window.addEventListener = function(...params) {
    eventListenersToClear.push({target: window, params});
    return nativeWindowEventListener.apply(this, params);
  };
  const nativeDocumentEventListener = document.addEventListener;
  document.addEventListener = function(...params) {
    eventListenersToClear.push({target: document, params});
    return nativeDocumentEventListener.apply(this, params);
  };
}

function endNativeEventListenerClearDown() {
  eventListenersToClear.forEach(({target, params}) => {
    target.removeEventListener(...params);
  });
}

describe('DOMModernPluginEventSystem', () => {
  let container;

  function withEnableLegacyFBSupport(enableLegacyFBSupport) {
    describe(
      'enableLegacyFBSupport ' +
        (enableLegacyFBSupport ? 'enabled' : 'disabled'),
      () => {
        beforeEach(() => {
          jest.resetModules();
          ReactFeatureFlags = require('shared/ReactFeatureFlags');
          ReactFeatureFlags.enableModernEventSystem = true;
          ReactFeatureFlags.enableLegacyFBSupport = enableLegacyFBSupport;

          React = require('react');
          ReactDOM = require('react-dom');
          Scheduler = require('scheduler');
          ReactDOMServer = require('react-dom/server');
          container = document.createElement('div');
          document.body.appendChild(container);
          startNativeEventListenerClearDown();
        });

        afterEach(() => {
          document.body.removeChild(container);
          container = null;
          endNativeEventListenerClearDown();
        });

        it('handle propagation of click events', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Test() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                <div
                  ref={divRef}
                  onClick={onClick}
                  onClickCapture={onClickCapture}>
                  Click me!
                </div>
              </button>
            );
          }

          ReactDOM.render(<Test />, container);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);

          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', buttonElement]);
          expect(log[3]).toEqual(['capture', divElement]);
          expect(log[4]).toEqual(['bubble', divElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between roots', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const childRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                <div ref={childRef} />
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);
          ReactDOM.render(<Child />, childRef.current);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', divElement]);
          expect(log[3]).toEqual(['bubble', divElement]);
          expect(log[4]).toEqual(['capture', buttonElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between disjointed roots', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}
              />
            );
          }

          const disjointedNode = document.createElement('div');
          ReactDOM.render(<Parent />, container);
          buttonRef.current.appendChild(disjointedNode);
          ReactDOM.render(<Child />, disjointedNode);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', divElement]);
          expect(log[3]).toEqual(['bubble', divElement]);
          expect(log[4]).toEqual(['capture', buttonElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between disjointed roots #2', () => {
          const buttonRef = React.createRef();
          const button2Ref = React.createRef();
          const divRef = React.createRef();
          const spanRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={button2Ref}
                onClick={onClick}
                onClickCapture={onClickCapture}
              />
            );
          }

          function GrandParent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                <span ref={spanRef} />
              </button>
            );
          }

          // We make a wrapper with an inner container that we
          // render to. So it looks like <div><span></span></div>
          // We then render to all three:
          // - container
          // - parentContainer
          // - childContainer

          const parentContainer = document.createElement('div');
          const childContainer = document.createElement('div');

          ReactDOM.render(<GrandParent />, container);
          ReactDOM.render(<Parent />, parentContainer);
          ReactDOM.render(<Child />, childContainer);

          parentContainer.appendChild(childContainer);
          spanRef.current.appendChild(parentContainer);

          // Inside <GrandParent />
          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          // Inside <Child />
          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', divElement]);
          expect(log[3]).toEqual(['bubble', divElement]);
          expect(log[4]).toEqual(['capture', buttonElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);

          // Inside <Parent />
          const buttonElement2 = button2Ref.current;
          dispatchClickEvent(buttonElement2);
          expect(onClick).toHaveBeenCalledTimes(5);
          expect(onClickCapture).toHaveBeenCalledTimes(5);
          expect(log[6]).toEqual(['capture', buttonElement2]);
          expect(log[7]).toEqual(['bubble', buttonElement2]);
          expect(log[8]).toEqual(['capture', buttonElement]);
          expect(log[9]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between disjointed comment roots', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}
              />
            );
          }

          // We use a comment node here, then mount to it
          const disjointedNode = document.createComment(
            ' react-mount-point-unstable ',
          );
          ReactDOM.render(<Parent />, container);
          buttonRef.current.appendChild(disjointedNode);
          ReactDOM.render(<Child />, disjointedNode);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', divElement]);
          expect(log[3]).toEqual(['bubble', divElement]);
          expect(log[4]).toEqual(['capture', buttonElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between disjointed comment roots #2', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const spanRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                <span ref={spanRef} />
              </button>
            );
          }

          // We use a comment node here, then mount to it
          const disjointedNode = document.createComment(
            ' react-mount-point-unstable ',
          );
          ReactDOM.render(<Parent />, container);
          spanRef.current.appendChild(disjointedNode);
          ReactDOM.render(<Child />, disjointedNode);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', divElement]);
          expect(log[3]).toEqual(['bubble', divElement]);
          expect(log[4]).toEqual(['capture', buttonElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of click events between portals', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          const portalElement = document.createElement('div');
          document.body.appendChild(portalElement);

          function Child() {
            return (
              <div
                ref={divRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                {ReactDOM.createPortal(<Child />, portalElement)}
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(3);
          expect(onClickCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', buttonElement]);
          expect(log[3]).toEqual(['capture', divElement]);
          expect(log[4]).toEqual(['bubble', divElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);

          document.body.removeChild(portalElement);
        });

        it('handle click events on document.body portals', () => {
          const log = [];

          function Child({label}) {
            return <div onClick={() => log.push(label)}>{label}</div>;
          }

          function Parent() {
            return (
              <>
                {ReactDOM.createPortal(
                  <Child label={'first'} />,
                  document.body,
                )}
                {ReactDOM.createPortal(
                  <Child label={'second'} />,
                  document.body,
                )}
              </>
            );
          }

          ReactDOM.render(<Parent />, container);

          const second = document.body.lastChild;
          expect(second.textContent).toEqual('second');
          dispatchClickEvent(second);

          expect(log).toEqual(['second']);

          const first = second.previousSibling;
          expect(first.textContent).toEqual('first');
          dispatchClickEvent(first);

          expect(log).toEqual(['second', 'first']);
        });

        // @gate experimental
        it('does not invoke an event on a parent tree when a subtree is dehydrated', async () => {
          let suspend = false;
          let resolve;
          const promise = new Promise(
            resolvePromise => (resolve = resolvePromise),
          );

          let clicks = 0;
          const childSlotRef = React.createRef();

          function Parent() {
            return <div onClick={() => clicks++} ref={childSlotRef} />;
          }

          function Child({text}) {
            if (suspend) {
              throw promise;
            } else {
              return <a>Click me</a>;
            }
          }

          function App() {
            // The root is a Suspense boundary.
            return (
              <React.Suspense fallback="Loading...">
                <Child />
              </React.Suspense>
            );
          }

          suspend = false;
          const finalHTML = ReactDOMServer.renderToString(<App />);

          const parentContainer = document.createElement('div');
          const childContainer = document.createElement('div');

          // We need this to be in the document since we'll dispatch events on it.
          document.body.appendChild(parentContainer);

          // We're going to use a different root as a parent.
          // This lets us detect whether an event goes through React's event system.
          const parentRoot = ReactDOM.createRoot(parentContainer);
          parentRoot.render(<Parent />);
          Scheduler.unstable_flushAll();

          childSlotRef.current.appendChild(childContainer);

          childContainer.innerHTML = finalHTML;

          const a = childContainer.getElementsByTagName('a')[0];

          suspend = true;

          // Hydrate asynchronously.
          const root = ReactDOM.createRoot(childContainer, {hydrate: true});
          root.render(<App />);
          jest.runAllTimers();
          Scheduler.unstable_flushAll();

          // The Suspense boundary is not yet hydrated.
          a.click();
          expect(clicks).toBe(0);

          // Resolving the promise so that rendering can complete.
          suspend = false;
          resolve();
          await promise;

          Scheduler.unstable_flushAll();
          jest.runAllTimers();

          // We're now full hydrated.

          expect(clicks).toBe(1);

          document.body.removeChild(parentContainer);
        });

        it('handle click events on dynamic portals', () => {
          const log = [];

          function Parent() {
            const ref = React.useRef(null);
            const [portal, setPortal] = React.useState(null);

            React.useEffect(() => {
              setPortal(
                ReactDOM.createPortal(
                  <span onClick={() => log.push('child')} id="child" />,
                  ref.current,
                ),
              );
            });

            return (
              <div ref={ref} onClick={() => log.push('parent')} id="parent">
                {portal}
              </div>
            );
          }

          ReactDOM.render(<Parent />, container);

          const parent = container.lastChild;
          expect(parent.id).toEqual('parent');
          dispatchClickEvent(parent);

          expect(log).toEqual(['parent']);

          const child = parent.lastChild;
          expect(child.id).toEqual('child');
          dispatchClickEvent(child);

          // we add both 'child' and 'parent' due to bubbling
          expect(log).toEqual(['parent', 'child', 'parent']);
        });

        // Slight alteration to the last test, to catch
        // a subtle difference in traversal.
        it('handle click events on dynamic portals #2', () => {
          const log = [];

          function Parent() {
            const ref = React.useRef(null);
            const [portal, setPortal] = React.useState(null);

            React.useEffect(() => {
              setPortal(
                ReactDOM.createPortal(
                  <span onClick={() => log.push('child')} id="child" />,
                  ref.current,
                ),
              );
            });

            return (
              <div ref={ref} onClick={() => log.push('parent')} id="parent">
                <div>{portal}</div>
              </div>
            );
          }

          ReactDOM.render(<Parent />, container);

          const parent = container.lastChild;
          expect(parent.id).toEqual('parent');
          dispatchClickEvent(parent);

          expect(log).toEqual(['parent']);

          const child = parent.lastChild;
          expect(child.id).toEqual('child');
          dispatchClickEvent(child);

          // we add both 'child' and 'parent' due to bubbling
          expect(log).toEqual(['parent', 'child', 'parent']);
        });

        it('native stopPropagation on click events between portals', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const middelDivRef = React.createRef();
          const log = [];
          const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onClickCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          const portalElement = document.createElement('div');
          document.body.appendChild(portalElement);

          function Child() {
            return (
              <div ref={middelDivRef}>
                <div
                  ref={divRef}
                  onClick={onClick}
                  onClickCapture={onClickCapture}>
                  Click me!
                </div>
              </div>
            );
          }

          function Parent() {
            React.useLayoutEffect(() => {
              // This should prevent the portalElement listeners from
              // capturing the events in the bubble phase.
              middelDivRef.current.addEventListener('click', e => {
                e.stopPropagation();
              });
            });

            return (
              <button
                ref={buttonRef}
                onClick={onClick}
                onClickCapture={onClickCapture}>
                {ReactDOM.createPortal(<Child />, portalElement)}
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          dispatchClickEvent(buttonElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          dispatchClickEvent(divElement);
          expect(onClick).toHaveBeenCalledTimes(1);
          expect(onClickCapture).toHaveBeenCalledTimes(1);

          document.body.removeChild(portalElement);
        });

        it('handle propagation of focus events', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onFocus = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onFocusCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Test() {
            return (
              <button
                ref={buttonRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}>
                <div
                  ref={divRef}
                  onFocus={onFocus}
                  onFocusCapture={onFocusCapture}
                  tabIndex={0}>
                  Click me!
                </div>
              </button>
            );
          }

          ReactDOM.render(<Test />, container);

          const buttonElement = buttonRef.current;
          buttonElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(1);
          expect(onFocusCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          divElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(3);
          expect(onFocusCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', buttonElement]);
          expect(log[3]).toEqual(['capture', divElement]);
          expect(log[4]).toEqual(['bubble', divElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);
        });

        it('handle propagation of focus events between roots', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const childRef = React.createRef();
          const log = [];
          const onFocus = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onFocusCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          function Child() {
            return (
              <div
                ref={divRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}
                tabIndex={0}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}>
                <div ref={childRef} />
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);
          ReactDOM.render(<Child />, childRef.current);

          const buttonElement = buttonRef.current;
          buttonElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(1);
          expect(onFocusCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          divElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(3);
          expect(onFocusCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', buttonElement]);
          expect(log[3]).toEqual(['bubble', buttonElement]);
          expect(log[4]).toEqual(['capture', divElement]);
          expect(log[5]).toEqual(['bubble', divElement]);
        });

        it('handle propagation of focus events between portals', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onFocus = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onFocusCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          const portalElement = document.createElement('div');
          document.body.appendChild(portalElement);

          function Child() {
            return (
              <div
                ref={divRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}
                tabIndex={0}>
                Click me!
              </div>
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}>
                {ReactDOM.createPortal(<Child />, portalElement)}
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          buttonElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(1);
          expect(onFocusCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          divElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(3);
          expect(onFocusCapture).toHaveBeenCalledTimes(3);
          expect(log[2]).toEqual(['capture', buttonElement]);
          expect(log[3]).toEqual(['capture', divElement]);
          expect(log[4]).toEqual(['bubble', divElement]);
          expect(log[5]).toEqual(['bubble', buttonElement]);

          document.body.removeChild(portalElement);
        });

        it('native stopPropagation on focus events between portals', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const middelDivRef = React.createRef();
          const log = [];
          const onFocus = jest.fn(e => log.push(['bubble', e.currentTarget]));
          const onFocusCapture = jest.fn(e =>
            log.push(['capture', e.currentTarget]),
          );

          const portalElement = document.createElement('div');
          document.body.appendChild(portalElement);

          function Child() {
            return (
              <div ref={middelDivRef}>
                <div
                  ref={divRef}
                  onClick={onFocus}
                  onClickCapture={onFocusCapture}
                  tabIndex={0}>
                  Click me!
                </div>
              </div>
            );
          }

          function Parent() {
            React.useLayoutEffect(() => {
              // This should prevent the portalElement listeners from
              // capturing the events in the bubble phase.
              middelDivRef.current.addEventListener('click', e => {
                e.stopPropagation();
              });
            });

            return (
              <button
                ref={buttonRef}
                onFocus={onFocus}
                onFocusCapture={onFocusCapture}>
                {ReactDOM.createPortal(<Child />, portalElement)}
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          buttonElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(1);
          expect(onFocusCapture).toHaveBeenCalledTimes(1);
          expect(log[0]).toEqual(['capture', buttonElement]);
          expect(log[1]).toEqual(['bubble', buttonElement]);

          const divElement = divRef.current;
          divElement.focus();
          expect(onFocus).toHaveBeenCalledTimes(1);
          expect(onFocusCapture).toHaveBeenCalledTimes(1);

          document.body.removeChild(portalElement);
        });

        it('handle propagation of enter and leave events between portals', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const log = [];
          const onMouseEnter = jest.fn(e => log.push(e.currentTarget));
          const onMouseLeave = jest.fn(e => log.push(e.currentTarget));

          const portalElement = document.createElement('div');
          document.body.appendChild(portalElement);

          function Child() {
            return (
              <div
                ref={divRef}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
            );
          }

          function Parent() {
            return (
              <button
                ref={buttonRef}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}>
                {ReactDOM.createPortal(<Child />, portalElement)}
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          buttonElement.dispatchEvent(
            new MouseEvent('mouseover', {
              bubbles: true,
              cancelable: true,
              relatedTarget: null,
            }),
          );
          expect(onMouseEnter).toHaveBeenCalledTimes(1);
          expect(onMouseLeave).toHaveBeenCalledTimes(0);
          expect(log[0]).toEqual(buttonElement);

          const divElement = divRef.current;
          buttonElement.dispatchEvent(
            new MouseEvent('mouseout', {
              bubbles: true,
              cancelable: true,
              relatedTarget: divElement,
            }),
          );
          divElement.dispatchEvent(
            new MouseEvent('mouseover', {
              bubbles: true,
              cancelable: true,
              relatedTarget: buttonElement,
            }),
          );
          expect(onMouseEnter).toHaveBeenCalledTimes(2);
          expect(onMouseLeave).toHaveBeenCalledTimes(0);
          expect(log[1]).toEqual(divElement);

          document.body.removeChild(portalElement);
        });

        it('handle propagation of enter and leave events between portals #2', () => {
          const buttonRef = React.createRef();
          const divRef = React.createRef();
          const portalRef = React.createRef();
          const log = [];
          const onMouseEnter = jest.fn(e => log.push(e.currentTarget));
          const onMouseLeave = jest.fn(e => log.push(e.currentTarget));

          function Child() {
            return (
              <div
                ref={divRef}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
            );
          }

          function Parent() {
            const [portal, setPortal] = React.useState(null);

            React.useLayoutEffect(() => {
              setPortal(ReactDOM.createPortal(<Child />, portalRef.current));
            }, []);

            return (
              <button
                ref={buttonRef}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}>
                <div ref={portalRef}>{portal}</div>
              </button>
            );
          }

          ReactDOM.render(<Parent />, container);

          const buttonElement = buttonRef.current;
          buttonElement.dispatchEvent(
            new MouseEvent('mouseover', {
              bubbles: true,
              cancelable: true,
              relatedTarget: null,
            }),
          );
          expect(onMouseEnter).toHaveBeenCalledTimes(1);
          expect(onMouseLeave).toHaveBeenCalledTimes(0);
          expect(log[0]).toEqual(buttonElement);

          const divElement = divRef.current;
          buttonElement.dispatchEvent(
            new MouseEvent('mouseout', {
              bubbles: true,
              cancelable: true,
              relatedTarget: divElement,
            }),
          );
          divElement.dispatchEvent(
            new MouseEvent('mouseover', {
              bubbles: true,
              cancelable: true,
              relatedTarget: buttonElement,
            }),
          );
          expect(onMouseEnter).toHaveBeenCalledTimes(2);
          expect(onMouseLeave).toHaveBeenCalledTimes(0);
          expect(log[1]).toEqual(divElement);
        });

        it('should preserve bubble/capture order between roots and nested portals', () => {
          const targetRef = React.createRef();
          let log = [];
          const onClickRoot = jest.fn(e => log.push('bubble root'));
          const onClickCaptureRoot = jest.fn(e => log.push('capture root'));
          const onClickPortal = jest.fn(e => log.push('bubble portal'));
          const onClickCapturePortal = jest.fn(e => log.push('capture portal'));

          function Portal() {
            return (
              <div
                onClick={onClickPortal}
                onClickCapture={onClickCapturePortal}
                ref={targetRef}>
                Click me!
              </div>
            );
          }

          const portalContainer = document.createElement('div');

          let shouldStopPropagation = false;
          portalContainer.addEventListener(
            'click',
            e => {
              if (shouldStopPropagation) {
                e.stopPropagation();
              }
            },
            false,
          );

          function Root() {
            const portalTargetRef = React.useRef(null);
            React.useLayoutEffect(() => {
              portalTargetRef.current.appendChild(portalContainer);
            });
            return (
              <div onClick={onClickRoot} onClickCapture={onClickCaptureRoot}>
                <div ref={portalTargetRef} />
                {ReactDOM.createPortal(<Portal />, portalContainer)}
              </div>
            );
          }

          ReactDOM.render(<Root />, container);

          const divElement = targetRef.current;
          dispatchClickEvent(divElement);
          expect(log).toEqual([
            'capture root',
            'capture portal',
            'bubble portal',
            'bubble root',
          ]);

          log = [];

          shouldStopPropagation = true;
          dispatchClickEvent(divElement);

          if (enableLegacyFBSupport) {
            // We aren't using roots with legacyFBSupport, we put clicks on the document, so we exbit the previous
            // behavior.
            expect(log).toEqual([]);
          } else {
            expect(log).toEqual([
              // The events on root probably shouldn't fire if a non-React intermediated. but current behavior is that they do.
              'capture root',
              'capture portal',
              'bubble portal',
              'bubble root',
            ]);
          }
        });

        describe('ReactDOM.createEventHandle', () => {
          beforeEach(() => {
            jest.resetModules();
            ReactFeatureFlags = require('shared/ReactFeatureFlags');
            ReactFeatureFlags.enableLegacyFBSupport = enableLegacyFBSupport;
            ReactFeatureFlags.enableModernEventSystem = true;
            ReactFeatureFlags.enableCreateEventHandleAPI = true;

            React = require('react');
            ReactDOM = require('react-dom');
            Scheduler = require('scheduler');
            ReactDOMServer = require('react-dom/server');
            ReactTestUtils = require('react-dom/test-utils');
          });

          // @gate experimental
          it('can render correctly with the ReactDOMServer', () => {
            const clickEvent = jest.fn();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              const divRef = React.useRef(null);

              React.useEffect(() => {
                click.setListener(divRef.current, clickEvent);
              });

              return <div ref={divRef}>Hello world</div>;
            }
            const output = ReactDOMServer.renderToString(<Test />);
            expect(output).toBe(`<div data-reactroot="">Hello world</div>`);
          });

          // @gate experimental
          it('can render correctly with the ReactDOMServer hydration', () => {
            const clickEvent = jest.fn();
            const spanRef = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click.setListener(spanRef.current, clickEvent);
              });

              return (
                <div>
                  <span ref={spanRef}>Hello world</span>
                </div>
              );
            }
            const output = ReactDOMServer.renderToString(<Test />);
            expect(output).toBe(
              `<div data-reactroot=""><span>Hello world</span></div>`,
            );
            container.innerHTML = output;
            ReactDOM.hydrate(<Test />, container);
            Scheduler.unstable_flushAll();
            dispatchClickEvent(spanRef.current);
            expect(clickEvent).toHaveBeenCalledTimes(1);
          });

          // @gate experimental
          it('should correctly work for a basic "click" listener', () => {
            let log = [];
            const clickEvent = jest.fn(event => {
              log.push({
                eventPhase: event.eventPhase,
                type: event.type,
                currentTarget: event.currentTarget,
                target: event.target,
              });
            });
            const divRef = React.createRef();
            const buttonRef = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click.setListener(buttonRef.current, clickEvent);
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            expect(container.innerHTML).toBe(
              '<button><div>Click me!</div></button>',
            );

            // Clicking the button should trigger the event callback
            let divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(log).toEqual([
              {
                eventPhase: 3,
                type: 'click',
                currentTarget: buttonRef.current,
                target: divRef.current,
              },
            ]);
            expect(clickEvent).toBeCalledTimes(1);

            // Unmounting the container and clicking should not work
            ReactDOM.render(null, container);
            Scheduler.unstable_flushAll();

            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(1);

            // Re-rendering the container and clicking should work
            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(2);

            log = [];

            // Clicking the button should also work
            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(log).toEqual([
              {
                eventPhase: 3,
                type: 'click',
                currentTarget: buttonRef.current,
                target: buttonRef.current,
              },
            ]);

            const click2 = ReactDOM.unstable_createEventHandle('click');

            function Test2({clickEvent2}) {
              React.useEffect(() => {
                click2.setListener(buttonRef.current, clickEvent2);
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            let clickEvent2 = jest.fn();
            ReactDOM.render(<Test2 clickEvent2={clickEvent2} />, container);
            Scheduler.unstable_flushAll();

            divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent2).toBeCalledTimes(1);

            // Reset the function we pass in, so it's different
            clickEvent2 = jest.fn();
            ReactDOM.render(<Test2 clickEvent2={clickEvent2} />, container);
            Scheduler.unstable_flushAll();

            divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent2).toBeCalledTimes(1);
          });

          // @gate experimental
          it('should correctly work for setting and clearing a basic "click" listener', () => {
            const clickEvent = jest.fn();
            const divRef = React.createRef();
            const buttonRef = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test({off}) {
              React.useEffect(() => {
                click.setListener(buttonRef.current, clickEvent);
              });

              React.useEffect(() => {
                if (off) {
                  click.setListener(buttonRef.current, null);
                }
              }, [off]);

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test off={false} />, container);
            Scheduler.unstable_flushAll();

            let divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(1);

            // The listener should get unmounted in the second effect
            ReactDOM.render(<Test off={true} />, container);
            Scheduler.unstable_flushAll();

            clickEvent.mockClear();

            divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(0);
          });

          // @gate experimental
          it('should handle the target being a text node', () => {
            const clickEvent = jest.fn();
            const buttonRef = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click.setListener(buttonRef.current, clickEvent);
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const textNode = buttonRef.current.firstChild;
            dispatchClickEvent(textNode);
            expect(clickEvent).toBeCalledTimes(1);
          });

          // @gate experimental
          it('handle propagation of click events', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const log = [];
            const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
            const onClickCapture = jest.fn(e =>
              log.push(['capture', e.currentTarget]),
            );
            const click = ReactDOM.unstable_createEventHandle('click');
            const clickCapture = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });

            function Test() {
              React.useEffect(() => {
                click.setListener(buttonRef.current, onClick);
                clickCapture.setListener(buttonRef.current, onClickCapture);
                click.setListener(divRef.current, onClick);
                clickCapture.setListener(divRef.current, onClickCapture);
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClickCapture).toHaveBeenCalledTimes(1);
            expect(log[0]).toEqual(['capture', buttonElement]);
            expect(log[1]).toEqual(['bubble', buttonElement]);

            log.length = 0;
            onClick.mockClear();
            onClickCapture.mockClear();

            const divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(onClick).toHaveBeenCalledTimes(2);
            expect(onClickCapture).toHaveBeenCalledTimes(2);
            expect(log[0]).toEqual(['capture', buttonElement]);
            expect(log[1]).toEqual(['capture', divElement]);
            expect(log[2]).toEqual(['bubble', divElement]);
            expect(log[3]).toEqual(['bubble', buttonElement]);
          });

          // @gate experimental
          it('handle propagation of click events mixed with onClick events', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const log = [];
            const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
            const onClickCapture = jest.fn(e =>
              log.push(['capture', e.currentTarget]),
            );
            const click = ReactDOM.unstable_createEventHandle('click');
            const clickCapture = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });

            function Test() {
              React.useEffect(() => {
                click.setListener(buttonRef.current, onClick);
                clickCapture.setListener(buttonRef.current, onClickCapture);
              });

              return (
                <button ref={buttonRef}>
                  <div
                    ref={divRef}
                    onClick={onClick}
                    onClickCapture={onClickCapture}>
                    Click me!
                  </div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClickCapture).toHaveBeenCalledTimes(1);
            expect(log[0]).toEqual(['capture', buttonElement]);
            expect(log[1]).toEqual(['bubble', buttonElement]);

            const divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(onClick).toHaveBeenCalledTimes(3);
            expect(onClickCapture).toHaveBeenCalledTimes(3);
            expect(log[2]).toEqual(['capture', buttonElement]);
            expect(log[3]).toEqual(['capture', divElement]);
            expect(log[4]).toEqual(['bubble', divElement]);
            expect(log[5]).toEqual(['bubble', buttonElement]);
          });

          // @gate experimental
          it('should correctly work for a basic "click" listener on the outer target', () => {
            const log = [];
            const clickEvent = jest.fn(event => {
              log.push({
                eventPhase: event.eventPhase,
                type: event.type,
                currentTarget: event.currentTarget,
                target: event.target,
              });
            });
            const divRef = React.createRef();
            const buttonRef = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click.setListener(divRef.current, clickEvent);
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            expect(container.innerHTML).toBe(
              '<button><div>Click me!</div></button>',
            );

            // Clicking the button should trigger the event callback
            let divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(log).toEqual([
              {
                eventPhase: 3,
                type: 'click',
                currentTarget: divRef.current,
                target: divRef.current,
              },
            ]);

            // Unmounting the container and clicking should not work
            ReactDOM.render(null, container);
            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(1);

            // Re-rendering the container and clicking should work
            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent).toBeCalledTimes(2);

            // Clicking the button should not work
            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(clickEvent).toBeCalledTimes(2);
          });

          // @gate experimental
          it('should correctly handle many nested target listeners', () => {
            const buttonRef = React.createRef();
            const targetListener1 = jest.fn();
            const targetListener2 = jest.fn();
            const targetListener3 = jest.fn();
            const targetListener4 = jest.fn();
            let click1 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            let click2 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            let click3 = ReactDOM.unstable_createEventHandle('click');
            let click4 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(buttonRef.current, targetListener1);
                click2.setListener(buttonRef.current, targetListener2);
                click3.setListener(buttonRef.current, targetListener3);
                click4.setListener(buttonRef.current, targetListener4);
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            let buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);

            expect(targetListener1).toHaveBeenCalledTimes(1);
            expect(targetListener2).toHaveBeenCalledTimes(1);
            expect(targetListener3).toHaveBeenCalledTimes(1);
            expect(targetListener4).toHaveBeenCalledTimes(1);

            click1 = ReactDOM.unstable_createEventHandle('click');
            click2 = ReactDOM.unstable_createEventHandle('click');
            click3 = ReactDOM.unstable_createEventHandle('click');
            click4 = ReactDOM.unstable_createEventHandle('click');

            function Test2() {
              React.useEffect(() => {
                click1.setListener(buttonRef.current, targetListener1);
                click2.setListener(buttonRef.current, targetListener2);
                click3.setListener(buttonRef.current, targetListener3);
                click4.setListener(buttonRef.current, targetListener4);
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test2 />, container);
            Scheduler.unstable_flushAll();

            buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(targetListener1).toHaveBeenCalledTimes(2);
            expect(targetListener2).toHaveBeenCalledTimes(2);
            expect(targetListener3).toHaveBeenCalledTimes(2);
            expect(targetListener4).toHaveBeenCalledTimes(2);
          });

          // @gate experimental
          it('should correctly handle stopPropagation corrrectly for target events', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const clickEvent = jest.fn();
            const click1 = ReactDOM.unstable_createEventHandle('click', {
              bind: buttonRef,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(buttonRef.current, clickEvent);
                click2.setListener(divRef.current, e => {
                  e.stopPropagation();
                });
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(clickEvent).toHaveBeenCalledTimes(0);
          });

          // @gate experimental
          it('should correctly handle stopPropagation corrrectly for many target events', () => {
            const buttonRef = React.createRef();
            const targetListerner1 = jest.fn(e => e.stopPropagation());
            const targetListerner2 = jest.fn(e => e.stopPropagation());
            const targetListerner3 = jest.fn(e => e.stopPropagation());
            const targetListerner4 = jest.fn(e => e.stopPropagation());
            const click1 = ReactDOM.unstable_createEventHandle('click');
            const click2 = ReactDOM.unstable_createEventHandle('click');
            const click3 = ReactDOM.unstable_createEventHandle('click');
            const click4 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(buttonRef.current, targetListerner1);
                click2.setListener(buttonRef.current, targetListerner2);
                click3.setListener(buttonRef.current, targetListerner3);
                click4.setListener(buttonRef.current, targetListerner4);
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(targetListerner1).toHaveBeenCalledTimes(1);
            expect(targetListerner2).toHaveBeenCalledTimes(1);
            expect(targetListerner3).toHaveBeenCalledTimes(1);
            expect(targetListerner4).toHaveBeenCalledTimes(1);
          });

          // @gate experimental
          it('should correctly handle stopPropagation for mixed capture/bubbling target listeners', () => {
            const buttonRef = React.createRef();
            const targetListerner1 = jest.fn(e => e.stopPropagation());
            const targetListerner2 = jest.fn(e => e.stopPropagation());
            const targetListerner3 = jest.fn(e => e.stopPropagation());
            const targetListerner4 = jest.fn(e => e.stopPropagation());
            const click1 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click3 = ReactDOM.unstable_createEventHandle('click');
            const click4 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(buttonRef.current, targetListerner1);
                click2.setListener(buttonRef.current, targetListerner2);
                click3.setListener(buttonRef.current, targetListerner3);
                click4.setListener(buttonRef.current, targetListerner4);
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(targetListerner1).toHaveBeenCalledTimes(1);
            expect(targetListerner2).toHaveBeenCalledTimes(1);
            expect(targetListerner3).toHaveBeenCalledTimes(0);
            expect(targetListerner4).toHaveBeenCalledTimes(0);
          });

          // @gate experimental
          it('should work with concurrent mode updates', async () => {
            const log = [];
            const ref = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test({counter}) {
              React.useLayoutEffect(() => {
                click.setListener(ref.current, () => {
                  log.push({counter});
                });
              });

              Scheduler.unstable_yieldValue('Test');
              return <button ref={ref}>Press me</button>;
            }

            const root = ReactDOM.createRoot(container);
            root.render(<Test counter={0} />);

            expect(Scheduler).toFlushAndYield(['Test']);

            // Click the button
            dispatchClickEvent(ref.current);
            expect(log).toEqual([{counter: 0}]);

            // Clear log
            log.length = 0;

            // Increase counter
            root.render(<Test counter={1} />);
            // Yield before committing
            expect(Scheduler).toFlushAndYieldThrough(['Test']);

            // Click the button again
            dispatchClickEvent(ref.current);
            expect(log).toEqual([{counter: 0}]);

            // Clear log
            log.length = 0;

            // Commit
            expect(Scheduler).toFlushAndYield([]);
            dispatchClickEvent(ref.current);
            expect(log).toEqual([{counter: 1}]);
          });

          // @gate experimental
          it('should correctly work for a basic "click" listener that upgrades', () => {
            const clickEvent = jest.fn();
            const buttonRef = React.createRef();
            const button2Ref = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click', {
              passive: false,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click', {
              passive: true,
            });

            function Test2() {
              React.useEffect(() => {
                click.setListener(button2Ref.current, clickEvent);
              });

              return <button ref={button2Ref}>Click me!</button>;
            }

            function Test({extra}) {
              React.useEffect(() => {
                click2.setListener(buttonRef.current, clickEvent);
              });

              return (
                <>
                  <button ref={buttonRef}>Click me!</button>
                  {extra && <Test2 />}
                </>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            let button = buttonRef.current;
            dispatchClickEvent(button);
            expect(clickEvent).toHaveBeenCalledTimes(1);

            ReactDOM.render(<Test extra={true} />, container);
            Scheduler.unstable_flushAll();

            clickEvent.mockClear();

            button = button2Ref.current;
            dispatchClickEvent(button);
            expect(clickEvent).toHaveBeenCalledTimes(1);
          });

          // @gate experimental
          it('should correctly work for a basic "click" listener that upgrades #2', () => {
            const clickEvent = jest.fn();
            const buttonRef = React.createRef();
            const button2Ref = React.createRef();
            const click = ReactDOM.unstable_createEventHandle('click', {
              passive: false,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click', {
              passive: undefined,
            });

            function Test2() {
              React.useEffect(() => {
                click.setListener(button2Ref.current, clickEvent);
              });

              return <button ref={button2Ref}>Click me!</button>;
            }

            function Test({extra}) {
              React.useEffect(() => {
                click2.setListener(buttonRef.current, clickEvent);
              });

              return (
                <>
                  <button ref={buttonRef}>Click me!</button>
                  {extra && <Test2 />}
                </>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            let button = buttonRef.current;
            dispatchClickEvent(button);
            expect(clickEvent).toHaveBeenCalledTimes(1);

            ReactDOM.render(<Test extra={true} />, container);
            Scheduler.unstable_flushAll();

            clickEvent.mockClear();

            button = button2Ref.current;
            dispatchClickEvent(button);
            expect(clickEvent).toHaveBeenCalledTimes(1);
          });

          // @gate experimental
          it('should correctly work for a basic "click" window listener', () => {
            const log = [];
            const clickEvent = jest.fn(event => {
              log.push({
                eventPhase: event.eventPhase,
                type: event.type,
                currentTarget: event.currentTarget,
                target: event.target,
              });
            });
            const click = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click.setListener(window, clickEvent);

                return () => {
                  click.setListener(window, null);
                };
              });

              return <button>Click anything!</button>;
            }
            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            expect(container.innerHTML).toBe(
              '<button>Click anything!</button>',
            );

            // Clicking outside the button should trigger the event callback
            dispatchClickEvent(document.body);
            expect(log[0]).toEqual({
              eventPhase: 3,
              type: 'click',
              currentTarget: window,
              target: document.body,
            });

            // Unmounting the container and clicking should not work
            ReactDOM.render(null, container);
            Scheduler.unstable_flushAll();

            dispatchClickEvent(document.body);
            expect(clickEvent).toBeCalledTimes(1);

            // Re-rendering and clicking the body should work again
            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            dispatchClickEvent(document.body);
            expect(clickEvent).toBeCalledTimes(2);
          });

          // @gate experimental
          it('handle propagation of click events on the window', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const log = [];
            const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
            const onClickCapture = jest.fn(e =>
              log.push(['capture', e.currentTarget]),
            );
            const click = ReactDOM.unstable_createEventHandle('click');
            const clickCapture = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });

            function Test() {
              React.useEffect(() => {
                click.setListener(window, onClick);
                clickCapture.setListener(window, onClickCapture);
                click.setListener(buttonRef.current, onClick);
                clickCapture.setListener(buttonRef.current, onClickCapture);
                click.setListener(divRef.current, onClick);
                clickCapture.setListener(divRef.current, onClickCapture);

                return () => {
                  click.setListener(window, null);
                  clickCapture.setListener(window, null);
                };
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(onClick).toHaveBeenCalledTimes(2);
            expect(onClickCapture).toHaveBeenCalledTimes(2);
            expect(log[0]).toEqual(['capture', window]);
            expect(log[1]).toEqual(['capture', buttonElement]);
            expect(log[2]).toEqual(['bubble', buttonElement]);
            expect(log[3]).toEqual(['bubble', window]);

            log.length = 0;
            onClick.mockClear();
            onClickCapture.mockClear();

            const divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(onClick).toHaveBeenCalledTimes(3);
            expect(onClickCapture).toHaveBeenCalledTimes(3);
            expect(log[0]).toEqual(['capture', window]);
            expect(log[1]).toEqual(['capture', buttonElement]);
            expect(log[2]).toEqual(['capture', divElement]);
            expect(log[3]).toEqual(['bubble', divElement]);
            expect(log[4]).toEqual(['bubble', buttonElement]);
            expect(log[5]).toEqual(['bubble', window]);
          });

          // @gate experimental
          it('should correctly handle stopPropagation for mixed listeners', () => {
            const buttonRef = React.createRef();
            const rootListerner1 = jest.fn(e => e.stopPropagation());
            const rootListerner2 = jest.fn();
            const targetListerner1 = jest.fn();
            const targetListerner2 = jest.fn();
            const click1 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click3 = ReactDOM.unstable_createEventHandle('click');
            const click4 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(window, rootListerner1);
                click2.setListener(buttonRef.current, targetListerner1);
                click3.setListener(window, rootListerner2);
                click4.setListener(buttonRef.current, targetListerner2);

                return () => {
                  click1.setListener(window, null);
                  click3.setListener(window, null);
                };
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(rootListerner1).toHaveBeenCalledTimes(1);
            expect(targetListerner1).toHaveBeenCalledTimes(0);
            expect(targetListerner2).toHaveBeenCalledTimes(0);
            expect(rootListerner2).toHaveBeenCalledTimes(0);
          });

          // @gate experimental
          it('should correctly handle stopPropagation for delegated listeners', () => {
            const buttonRef = React.createRef();
            const rootListerner1 = jest.fn(e => e.stopPropagation());
            const rootListerner2 = jest.fn();
            const rootListerner3 = jest.fn(e => e.stopPropagation());
            const rootListerner4 = jest.fn();
            const click1 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click2 = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });
            const click3 = ReactDOM.unstable_createEventHandle('click');
            const click4 = ReactDOM.unstable_createEventHandle('click');

            function Test() {
              React.useEffect(() => {
                click1.setListener(window, rootListerner1);
                click2.setListener(window, rootListerner2);
                click3.setListener(window, rootListerner3);
                click4.setListener(window, rootListerner4);

                return () => {
                  click1.setListener(window, null);
                  click2.setListener(window, null);
                  click3.setListener(window, null);
                  click4.setListener(window, null);
                };
              });

              return <button ref={buttonRef}>Click me!</button>;
            }

            ReactDOM.render(<Test />, container);

            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(rootListerner1).toHaveBeenCalledTimes(1);
            expect(rootListerner2).toHaveBeenCalledTimes(1);
            expect(rootListerner3).toHaveBeenCalledTimes(0);
            expect(rootListerner4).toHaveBeenCalledTimes(0);
          });

          // @gate experimental
          it('handle propagation of click events on the window and document', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const log = [];
            const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
            const onClickCapture = jest.fn(e =>
              log.push(['capture', e.currentTarget]),
            );
            const click = ReactDOM.unstable_createEventHandle('click');
            const clickCapture = ReactDOM.unstable_createEventHandle('click', {
              capture: true,
            });

            function Test() {
              React.useEffect(() => {
                click.setListener(window, onClick);
                clickCapture.setListener(window, onClickCapture);
                click.setListener(document, onClick);
                clickCapture.setListener(document, onClickCapture);
                click.setListener(buttonRef.current, onClick);
                clickCapture.setListener(buttonRef.current, onClickCapture);
                click.setListener(divRef.current, onClick);
                clickCapture.setListener(divRef.current, onClickCapture);

                return () => {
                  click.setListener(window, null);
                  clickCapture.setListener(window, null);
                  click.setListener(document, null);
                  clickCapture.setListener(document, null);
                };
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchClickEvent(buttonElement);
            expect(onClick).toHaveBeenCalledTimes(3);
            expect(onClickCapture).toHaveBeenCalledTimes(3);

            if (enableLegacyFBSupport) {
              expect(log[0]).toEqual(['capture', window]);
              expect(log[1]).toEqual(['capture', document]);
              expect(log[2]).toEqual(['bubble', document]);
              expect(log[3]).toEqual(['capture', buttonElement]);
              expect(log[4]).toEqual(['bubble', buttonElement]);
              expect(log[5]).toEqual(['bubble', window]);
            } else {
              expect(log[0]).toEqual(['capture', window]);
              expect(log[1]).toEqual(['capture', document]);
              expect(log[2]).toEqual(['capture', buttonElement]);
              expect(log[3]).toEqual(['bubble', buttonElement]);
              expect(log[4]).toEqual(['bubble', document]);
              expect(log[5]).toEqual(['bubble', window]);
            }

            log.length = 0;
            onClick.mockClear();
            onClickCapture.mockClear();

            const divElement = divRef.current;
            dispatchClickEvent(divElement);
            expect(onClick).toHaveBeenCalledTimes(4);
            expect(onClickCapture).toHaveBeenCalledTimes(4);

            if (enableLegacyFBSupport) {
              expect(log[0]).toEqual(['capture', window]);
              expect(log[1]).toEqual(['capture', document]);
              expect(log[2]).toEqual(['bubble', document]);
              expect(log[3]).toEqual(['capture', buttonElement]);
              expect(log[4]).toEqual(['capture', divElement]);
              expect(log[5]).toEqual(['bubble', divElement]);
              expect(log[6]).toEqual(['bubble', buttonElement]);
              expect(log[7]).toEqual(['bubble', window]);
            } else {
              expect(log[0]).toEqual(['capture', window]);
              expect(log[1]).toEqual(['capture', document]);
              expect(log[2]).toEqual(['capture', buttonElement]);
              expect(log[3]).toEqual(['capture', divElement]);
              expect(log[4]).toEqual(['bubble', divElement]);
              expect(log[5]).toEqual(['bubble', buttonElement]);
              expect(log[6]).toEqual(['bubble', document]);
              expect(log[7]).toEqual(['bubble', window]);
            }
          });

          // @gate experimental
          it('handles propagation of custom user events', () => {
            const buttonRef = React.createRef();
            const divRef = React.createRef();
            const log = [];
            const onCustomEvent = jest.fn(e =>
              log.push(['bubble', e.currentTarget]),
            );
            const onCustomEventCapture = jest.fn(e =>
              log.push(['capture', e.currentTarget]),
            );

            let customEventHandle;

            // Test that we get a warning when we don't provide an explicit priortiy
            expect(() => {
              customEventHandle = ReactDOM.unstable_createEventHandle(
                'custom-event',
              );
            }).toWarnDev(
              'Warning: The event "type" provided to createEventHandle() does not have a known priority type. ' +
                'It is recommended to provide a "priority" option to specify a priority.',
              {withoutStack: true},
            );

            customEventHandle = ReactDOM.unstable_createEventHandle(
              'custom-event',
              {
                priority: 0, // Discrete
              },
            );

            const customCaptureHandle = ReactDOM.unstable_createEventHandle(
              'custom-event',
              {
                capture: true,
                priority: 0, // Discrete
              },
            );

            function Test() {
              React.useEffect(() => {
                customEventHandle.setListener(buttonRef.current, onCustomEvent);
                customCaptureHandle.setListener(
                  buttonRef.current,
                  onCustomEventCapture,
                );
                customEventHandle.setListener(divRef.current, onCustomEvent);
                customCaptureHandle.setListener(
                  divRef.current,
                  onCustomEventCapture,
                );
              });

              return (
                <button ref={buttonRef}>
                  <div ref={divRef}>Click me!</div>
                </button>
              );
            }

            ReactDOM.render(<Test />, container);
            Scheduler.unstable_flushAll();

            const buttonElement = buttonRef.current;
            dispatchEvent(buttonElement, 'custom-event');
            expect(onCustomEvent).toHaveBeenCalledTimes(1);
            expect(onCustomEventCapture).toHaveBeenCalledTimes(1);
            expect(log[0]).toEqual(['capture', buttonElement]);
            expect(log[1]).toEqual(['bubble', buttonElement]);

            const divElement = divRef.current;
            dispatchEvent(divElement, 'custom-event');
            expect(onCustomEvent).toHaveBeenCalledTimes(3);
            expect(onCustomEventCapture).toHaveBeenCalledTimes(3);
            expect(log[2]).toEqual(['capture', buttonElement]);
            expect(log[3]).toEqual(['capture', divElement]);
            expect(log[4]).toEqual(['bubble', divElement]);
            expect(log[5]).toEqual(['bubble', buttonElement]);
          });

          // @gate experimental
          it('beforeblur and afterblur are called after a focused element is unmounted', () => {
            const log = [];
            // We have to persist here because we want to read relatedTarget later.
            const onAfterBlur = jest.fn(e => {
              e.persist();
              log.push(e.type);
            });
            const onBeforeBlur = jest.fn(e => log.push(e.type));
            const innerRef = React.createRef();
            const innerRef2 = React.createRef();
            const afterBlurHandle = ReactDOM.unstable_createEventHandle(
              'afterblur',
            );
            const beforeBlurHandle = ReactDOM.unstable_createEventHandle(
              'beforeblur',
            );

            const Component = ({show}) => {
              const ref = React.useRef(null);

              React.useEffect(() => {
                afterBlurHandle.setListener(document, onAfterBlur);
                beforeBlurHandle.setListener(ref.current, onBeforeBlur);
              });

              return (
                <div ref={ref}>
                  {show && <input ref={innerRef} />}
                  <div ref={innerRef2} />
                </div>
              );
            };

            ReactDOM.render(<Component show={true} />, container);
            Scheduler.unstable_flushAll();

            const inner = innerRef.current;
            const target = createEventTarget(inner);
            target.focus();
            expect(onBeforeBlur).toHaveBeenCalledTimes(0);
            expect(onAfterBlur).toHaveBeenCalledTimes(0);

            ReactDOM.render(<Component show={false} />, container);
            Scheduler.unstable_flushAll();

            expect(onBeforeBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledWith(
              expect.objectContaining({relatedTarget: inner}),
            );
            expect(log).toEqual(['beforeblur', 'afterblur']);
          });

          // @gate experimental
          it('beforeblur and afterblur are called after a nested focused element is unmounted', () => {
            const log = [];
            // We have to persist here because we want to read relatedTarget later.
            const onAfterBlur = jest.fn(e => {
              e.persist();
              log.push(e.type);
            });
            const onBeforeBlur = jest.fn(e => log.push(e.type));
            const innerRef = React.createRef();
            const innerRef2 = React.createRef();
            const afterBlurHandle = ReactDOM.unstable_createEventHandle(
              'afterblur',
            );
            const beforeBlurHandle = ReactDOM.unstable_createEventHandle(
              'beforeblur',
            );

            const Component = ({show}) => {
              const ref = React.useRef(null);

              React.useEffect(() => {
                afterBlurHandle.setListener(document, onAfterBlur);
                beforeBlurHandle.setListener(ref.current, onBeforeBlur);
              });

              return (
                <div ref={ref}>
                  {show && (
                    <div>
                      <input ref={innerRef} />
                    </div>
                  )}
                  <div ref={innerRef2} />
                </div>
              );
            };

            ReactDOM.render(<Component show={true} />, container);
            Scheduler.unstable_flushAll();

            const inner = innerRef.current;
            const target = createEventTarget(inner);
            target.focus();
            expect(onBeforeBlur).toHaveBeenCalledTimes(0);
            expect(onAfterBlur).toHaveBeenCalledTimes(0);

            ReactDOM.render(<Component show={false} />, container);
            Scheduler.unstable_flushAll();

            expect(onBeforeBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledWith(
              expect.objectContaining({relatedTarget: inner}),
            );
            expect(log).toEqual(['beforeblur', 'afterblur']);
          });

          // @gate experimental
          it('beforeblur and afterblur are called after a focused element is suspended', () => {
            const log = [];
            // We have to persist here because we want to read relatedTarget later.
            const onAfterBlur = jest.fn(e => {
              e.persist();
              log.push(e.type);
            });
            const onBeforeBlur = jest.fn(e => log.push(e.type));
            const innerRef = React.createRef();
            const Suspense = React.Suspense;
            let suspend = false;
            let resolve;
            const promise = new Promise(
              resolvePromise => (resolve = resolvePromise),
            );
            const afterBlurHandle = ReactDOM.unstable_createEventHandle(
              'afterblur',
            );
            const beforeBlurHandle = ReactDOM.unstable_createEventHandle(
              'beforeblur',
            );

            function Child() {
              if (suspend) {
                throw promise;
              } else {
                return <input ref={innerRef} />;
              }
            }

            const Component = () => {
              const ref = React.useRef(null);

              React.useEffect(() => {
                afterBlurHandle.setListener(document, onAfterBlur);
                beforeBlurHandle.setListener(ref.current, onBeforeBlur);
              });

              return (
                <div ref={ref}>
                  <Suspense fallback="Loading...">
                    <Child />
                  </Suspense>
                </div>
              );
            };

            const container2 = document.createElement('div');
            document.body.appendChild(container2);

            const root = ReactDOM.createRoot(container2);

            ReactTestUtils.act(() => {
              root.render(<Component />);
            });
            jest.runAllTimers();

            const inner = innerRef.current;
            const target = createEventTarget(inner);
            target.focus();
            expect(onBeforeBlur).toHaveBeenCalledTimes(0);
            expect(onAfterBlur).toHaveBeenCalledTimes(0);

            suspend = true;
            ReactTestUtils.act(() => {
              root.render(<Component />);
            });
            jest.runAllTimers();

            expect(onBeforeBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledTimes(1);
            expect(onAfterBlur).toHaveBeenCalledWith(
              expect.objectContaining({relatedTarget: inner}),
            );
            resolve();
            expect(log).toEqual(['beforeblur', 'afterblur']);

            document.body.removeChild(container2);
          });

          describe('Compatibility with Scopes API', () => {
            beforeEach(() => {
              jest.resetModules();
              ReactFeatureFlags = require('shared/ReactFeatureFlags');
              ReactFeatureFlags.enableModernEventSystem = true;
              ReactFeatureFlags.enableCreateEventHandleAPI = true;
              ReactFeatureFlags.enableScopeAPI = true;

              React = require('react');
              ReactDOM = require('react-dom');
              Scheduler = require('scheduler');
              ReactDOMServer = require('react-dom/server');
            });

            // @gate experimental
            it('handle propagation of click events on a scope', () => {
              const buttonRef = React.createRef();
              const log = [];
              const onClick = jest.fn(e =>
                log.push(['bubble', e.currentTarget]),
              );
              const onClickCapture = jest.fn(e =>
                log.push(['capture', e.currentTarget]),
              );
              const TestScope = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');
              const clickCapture = ReactDOM.unstable_createEventHandle(
                'click',
                {
                  capture: true,
                },
              );

              function Test() {
                const scopeRef = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, onClick);
                  clickCapture.setListener(scopeRef.current, onClickCapture);
                });

                return (
                  <TestScope ref={scopeRef}>
                    <button ref={buttonRef} />
                  </TestScope>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const buttonElement = buttonRef.current;
              dispatchClickEvent(buttonElement);

              expect(onClick).toHaveBeenCalledTimes(1);
              expect(onClickCapture).toHaveBeenCalledTimes(1);
              expect(log).toEqual([
                ['capture', buttonElement],
                ['bubble', buttonElement],
              ]);
            });

            // @gate experimental
            it('handle mixed propagation of click events on a scope', () => {
              const buttonRef = React.createRef();
              const divRef = React.createRef();
              const log = [];
              const onClick = jest.fn(e =>
                log.push(['bubble', e.currentTarget]),
              );
              const onClickCapture = jest.fn(e =>
                log.push(['capture', e.currentTarget]),
              );
              const TestScope = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');
              const clickCapture = ReactDOM.unstable_createEventHandle(
                'click',
                {
                  capture: true,
                },
              );

              function Test() {
                const scopeRef = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, onClick);
                  clickCapture.setListener(scopeRef.current, onClickCapture);
                  click.setListener(buttonRef.current, onClick);
                  clickCapture.setListener(buttonRef.current, onClickCapture);
                });

                return (
                  <TestScope ref={scopeRef}>
                    <button ref={buttonRef}>
                      <div
                        ref={divRef}
                        onClick={onClick}
                        onClickCapture={onClickCapture}>
                        Click me!
                      </div>
                    </button>
                  </TestScope>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const buttonElement = buttonRef.current;
              dispatchClickEvent(buttonElement);

              expect(onClick).toHaveBeenCalledTimes(2);
              expect(onClickCapture).toHaveBeenCalledTimes(2);
              expect(log).toEqual([
                ['capture', buttonElement],
                ['capture', buttonElement],
                ['bubble', buttonElement],
                ['bubble', buttonElement],
              ]);

              log.length = 0;
              onClick.mockClear();
              onClickCapture.mockClear();

              const divElement = divRef.current;
              dispatchClickEvent(divElement);

              expect(onClick).toHaveBeenCalledTimes(3);
              expect(onClickCapture).toHaveBeenCalledTimes(3);
              expect(log).toEqual([
                ['capture', buttonElement],
                ['capture', buttonElement],
                ['capture', divElement],
                ['bubble', divElement],
                ['bubble', buttonElement],
                ['bubble', buttonElement],
              ]);
            });

            // @gate experimental
            it('should not handle the target being a dangling text node within a scope', () => {
              const clickEvent = jest.fn();
              const buttonRef = React.createRef();
              const TestScope = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');

              function Test() {
                const scopeRef = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, clickEvent);
                });

                return (
                  <button ref={buttonRef}>
                    <TestScope ref={scopeRef}>Click me!</TestScope>
                  </button>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const textNode = buttonRef.current.firstChild;
              dispatchClickEvent(textNode);
              // This should not work, as the target instance will be the
              // <button>, which is actually outside the scope.
              expect(clickEvent).toBeCalledTimes(0);
            });

            // @gate experimental
            it('handle stopPropagation (inner) correctly between scopes', () => {
              const buttonRef = React.createRef();
              const outerOnClick = jest.fn();
              const innerOnClick = jest.fn(e => e.stopPropagation());
              const TestScope = React.unstable_createScope();
              const TestScope2 = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');

              function Test() {
                const scopeRef = React.useRef(null);
                const scope2Ref = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, outerOnClick);
                  click.setListener(scope2Ref.current, innerOnClick);
                });

                return (
                  <TestScope ref={scopeRef}>
                    <TestScope2 ref={scope2Ref}>
                      <button ref={buttonRef} />
                    </TestScope2>
                  </TestScope>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const buttonElement = buttonRef.current;
              dispatchClickEvent(buttonElement);

              expect(innerOnClick).toHaveBeenCalledTimes(1);
              expect(outerOnClick).toHaveBeenCalledTimes(0);
            });

            // @gate experimental
            it('handle stopPropagation (outer) correctly between scopes', () => {
              const buttonRef = React.createRef();
              const outerOnClick = jest.fn(e => e.stopPropagation());
              const innerOnClick = jest.fn();
              const TestScope = React.unstable_createScope();
              const TestScope2 = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');

              function Test() {
                const scopeRef = React.useRef(null);
                const scope2Ref = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, outerOnClick);
                  click.setListener(scope2Ref.current, innerOnClick);
                });

                return (
                  <TestScope ref={scopeRef}>
                    <TestScope2 ref={scope2Ref}>
                      <button ref={buttonRef} />
                    </TestScope2>
                  </TestScope>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const buttonElement = buttonRef.current;
              dispatchClickEvent(buttonElement);

              expect(innerOnClick).toHaveBeenCalledTimes(1);
              expect(outerOnClick).toHaveBeenCalledTimes(1);
            });

            // @gate experimental
            it('handle stopPropagation (inner and outer) correctly between scopes', () => {
              const buttonRef = React.createRef();
              const onClick = jest.fn(e => e.stopPropagation());
              const TestScope = React.unstable_createScope();
              const TestScope2 = React.unstable_createScope();
              const click = ReactDOM.unstable_createEventHandle('click');

              function Test() {
                const scopeRef = React.useRef(null);
                const scope2Ref = React.useRef(null);

                React.useEffect(() => {
                  click.setListener(scopeRef.current, onClick);
                  click.setListener(scope2Ref.current, onClick);
                });

                return (
                  <TestScope ref={scopeRef}>
                    <TestScope2 ref={scope2Ref}>
                      <button ref={buttonRef} />
                    </TestScope2>
                  </TestScope>
                );
              }

              ReactDOM.render(<Test />, container);
              Scheduler.unstable_flushAll();

              const buttonElement = buttonRef.current;
              dispatchClickEvent(buttonElement);

              expect(onClick).toHaveBeenCalledTimes(1);
            });
          });
        });
      },
    );
  }

  withEnableLegacyFBSupport(false);
  withEnableLegacyFBSupport(true);
});
