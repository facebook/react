/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('ReactDOMConsoleErrorReporting', () => {
  let act;
  let React;
  let ReactDOM;
  let ReactDOMClient;

  let ErrorBoundary;
  let NoError;
  let container;
  let windowOnError;
  let waitForThrow;

  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');

    const InternalTestUtils = require('internal-test-utils');
    waitForThrow = InternalTestUtils.waitForThrow;

    ErrorBoundary = class extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <h1>Caught: {this.state.error.message}</h1>;
        }
        return this.props.children;
      }
    };
    NoError = function () {
      return <h1>OK</h1>;
    };
    container = document.createElement('div');
    document.body.appendChild(container);
    windowOnError = jest.fn();
    window.addEventListener('error', windowOnError);
  });

  afterEach(() => {
    document.body.removeChild(container);
    window.removeEventListener('error', windowOnError);
    jest.restoreAllMocks();
  });

  describe('ReactDOMClient.createRoot', () => {
    it('logs errors during event handlers', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        return (
          <button
            onClick={() => {
              throw Error('Boom');
            }}>
            click me
          </button>
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Foo />);
      });

      await act(() => {
        container.firstChild.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
          }),
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
        ]);
      } else {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs render errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      const root = ReactDOMClient.createRoot(container);
      await act(async () => {
        root.render(<Foo />);
        await waitForThrow('Boom');
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs render errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs layout effect errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      await act(async () => {
        root.render(<Foo />);
        await waitForThrow('Boom');
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs layout effect errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs passive effect errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      await act(async () => {
        root.render(<Foo />);
        await waitForThrow('Boom');
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });

    it('logs passive effect errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([]);
      }
    });
  });

  describe('ReactDOM.render', () => {
    it('logs errors during event handlers', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        return (
          <button
            onClick={() => {
              throw Error('Boom');
            }}>
            click me
          </button>
        );
      }

      await act(() => {
        ReactDOM.render(<Foo />, container);
      });

      await act(() => {
        container.firstChild.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
          }),
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
        ]);
      } else {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs render errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      expect(() => {
        ReactDOM.render(<Foo />, container);
      }).toThrow('Boom');

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs render errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      await act(() => {
        ReactDOM.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
          container,
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs layout effect errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      expect(() => {
        ReactDOM.render(<Foo />, container);
      }).toThrow('Boom');

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs layout effect errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      await act(() => {
        ReactDOM.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
          container,
        );
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs passive effect errors without an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      await act(async () => {
        ReactDOM.render(<Foo />, container);
        await waitForThrow('Boom');
      });

      if (__DEV__) {
        expect(windowOnError.mock.calls).toEqual([
          [
            // Reported due to guarded callback:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs passive effect errors with an error boundary', async () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      await act(() => {
        ReactDOM.render(
          <ErrorBoundary>
            <Foo />
          </ErrorBoundary>,
          container,
        );
      });

      if (__DEV__) {
        // Reported due to guarded callback:
        expect(windowOnError.mock.calls).toEqual([
          [
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.objectContaining({
              detail: expect.objectContaining({
                message: 'Boom',
              }),
              type: 'unhandled exception',
            }),
          ],
          [
            // Addendum by React:
            expect.stringContaining(
              'The above error occurred in the <Foo> component',
            ),
          ],
        ]);
      } else {
        // The top-level error was caught with try/catch, and there's no guarded callback,
        // so in production we don't see an error event.
        expect(windowOnError.mock.calls).toEqual([]);
        expect(console.error.mock.calls).toEqual([
          [
            // Reported by React with no extra message:
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.mockReset();
      await act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.mock.calls).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });
  });
});
