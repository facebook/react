/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  beforeEach(() => {
    jest.resetModules();
    act = require('jest-react').act;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');

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
    NoError = function() {
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
  });

  describe('ReactDOMClient.createRoot', () => {
    it('logs errors during event handlers', () => {
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
      act(() => {
        root.render(<Foo />);
      });

      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs render errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      const root = ReactDOMClient.createRoot(container);
      expect(() => {
        act(() => {
          root.render(<Foo />);
        });
      }).toThrow('Boom');

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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs render errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      const root = ReactDOMClient.createRoot(container);
      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This is only duplicated with createRoot
            // because it retries once with a sync render.
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs layout effect errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      expect(() => {
        act(() => {
          root.render(<Foo />);
        });
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs layout effect errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs passive effect errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      expect(() => {
        act(() => {
          root.render(<Foo />);
        });
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });

    it('logs passive effect errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      const root = ReactDOMClient.createRoot(container);
      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        root.render(<NoError />);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([]);
      }
    });
  });

  describe('ReactDOM.render', () => {
    it('logs errors during event handlers', () => {
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

      act(() => {
        ReactDOM.render(<Foo />, container);
      });

      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported because we're in a browser click event:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
          [
            // This one is jsdom-only. Real browser deduplicates it.
            // (In DEV, we have a nested event due to guarded callback.)
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [
            // Reported because we're in a browser click event:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
            }),
          ],
        ]);
      }

      // Check next render doesn't throw.
      windowOnError.mockReset();
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs render errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      expect(() => {
        act(() => {
          ReactDOM.render(<Foo />, container);
        });
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs render errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        throw Error('Boom');
      }

      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs layout effect errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      expect(() => {
        act(() => {
          ReactDOM.render(<Foo />, container);
        });
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs layout effect errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useLayoutEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs passive effect errors without an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      expect(() => {
        act(() => {
          ReactDOM.render(<Foo />, container);
        });
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });

    it('logs passive effect errors with an error boundary', () => {
      spyOnDevAndProd(console, 'error');

      function Foo() {
        React.useEffect(() => {
          throw Error('Boom');
        }, []);
        return null;
      }

      act(() => {
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
          [
            // Reported by jsdom due to the guarded callback:
            expect.stringContaining('Error: Uncaught [Error: Boom]'),
            expect.objectContaining({
              message: 'Boom',
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
        expect(console.error.calls.all().map(c => c.args)).toEqual([
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
      console.error.calls.reset();
      act(() => {
        ReactDOM.render(<NoError />, container);
      });
      expect(container.textContent).toBe('OK');
      expect(windowOnError.mock.calls).toEqual([]);
      if (__DEV__) {
        expect(console.error.calls.all().map(c => c.args)).toEqual([
          [expect.stringContaining('ReactDOM.render is no longer supported')],
        ]);
      }
    });
  });
});
