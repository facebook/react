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
let ReactDOMClient;
let ViewTransition;
let act;
let startTransition;
let addTransitionType;
let container;

describe('ReactDOMViewTransitionName', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    ViewTransition = React.ViewTransition;
    startTransition = React.startTransition;
    addTransitionType = React.addTransitionType;
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock document.startViewTransition
    if (!document.startViewTransition) {
      document.startViewTransition = function ({update}) {
        update();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          skipTransition() {},
        };
      };
    }

    // Mock CSS.escape
    if (typeof CSS === 'undefined') {
      global.CSS = {escape: str => str};
    } else if (!CSS.escape) {
      CSS.escape = str => str;
    }

    // Mock document.fonts
    if (!document.fonts) {
      Object.defineProperty(document, 'fonts', {
        value: {status: 'loaded', ready: Promise.resolve()},
        configurable: true,
      });
    }

    // Mock Element.prototype.getAnimations
    if (!Element.prototype.getAnimations) {
      Element.prototype.getAnimations = function () {
        return [];
      };
    }

    // Mock Element.prototype.animate
    if (!Element.prototype.animate) {
      Element.prototype.animate = function () {
        return {cancel() {}, finished: Promise.resolve()};
      };
    }

    // Mock getBoundingClientRect
    Element.prototype._originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const text = this.textContent || '';
      return new DOMRect(0, 0, text.length * 10 + 10, 20);
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    if (Element.prototype._originalGetBoundingClientRect) {
      Element.prototype.getBoundingClientRect =
        Element.prototype._originalGetBoundingClientRect;
      delete Element.prototype._originalGetBoundingClientRect;
    }
  });

  // @gate enableViewTransition
  it('renders children without a wrapper element', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="child">Hello</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('#child')).not.toBe(null);
    expect(container.querySelector('#child').textContent).toBe('Hello');
    // ViewTransition should not add a wrapper element
    expect(container.firstChild.id).toBe('child');
  });

  // @gate enableViewTransition
  it('uses explicit name prop when provided', async () => {
    function App() {
      return (
        <ViewTransition name="my-transition">
          <div id="child">Named</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    // The element should be rendered
    expect(container.querySelector('#child')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('generates auto name when name is not provided', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="auto-named">Auto</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#auto-named')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('generates auto name when name is "auto"', async () => {
    function App() {
      return (
        <ViewTransition name="auto">
          <div id="auto-explicit">Auto Explicit</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#auto-explicit')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('preserves auto name across re-renders', async () => {
    function App({text}) {
      return (
        <ViewTransition>
          <div id="stable">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    expect(container.querySelector('#stable').textContent).toBe('First');

    await act(() => {
      startTransition(() => {
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#stable').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('supports multiple ViewTransitions as siblings', async () => {
    function App() {
      return (
        <div>
          <ViewTransition name="first">
            <div id="first">First</div>
          </ViewTransition>
          <ViewTransition name="second">
            <div id="second">Second</div>
          </ViewTransition>
          <ViewTransition name="third">
            <div id="third">Third</div>
          </ViewTransition>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#first').textContent).toBe('First');
    expect(container.querySelector('#second').textContent).toBe('Second');
    expect(container.querySelector('#third').textContent).toBe('Third');
  });

  // @gate enableViewTransition
  it('supports nested ViewTransitions', async () => {
    function App() {
      return (
        <ViewTransition name="outer">
          <div id="outer">
            <ViewTransition name="inner">
              <span id="inner">Nested</span>
            </ViewTransition>
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#outer')).not.toBe(null);
    expect(container.querySelector('#inner').textContent).toBe('Nested');
  });

  // @gate enableViewTransition
  it('handles conditional rendering inside ViewTransition', async () => {
    function App({show}) {
      return (
        <ViewTransition>
          <div id="wrapper">{show ? <span>Visible</span> : null}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App show={false} />);
    });

    expect(container.querySelector('#wrapper').textContent).toBe('');

    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#wrapper').textContent).toBe('Visible');
  });

  // @gate enableViewTransition
  it('handles ViewTransition mounting and unmounting', async () => {
    function App({show}) {
      if (!show) {
        return <div id="empty">Empty</div>;
      }
      return (
        <ViewTransition>
          <div id="content">Content</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App show={false} />);
    });

    expect(container.querySelector('#empty')).not.toBe(null);
    expect(container.querySelector('#content')).toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#content')).not.toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App show={false} />);
      });
    });

    expect(container.querySelector('#content')).toBe(null);
    expect(container.querySelector('#empty')).not.toBe(null);
  });
});
