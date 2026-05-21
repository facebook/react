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

describe('ReactDOMViewTransitionClass', () => {
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
  it('accepts a string as the default class', async () => {
    function App() {
      return (
        <ViewTransition default="fade-in">
          <div id="child">Hello</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#child')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('accepts a string as the update class', async () => {
    function App({text}) {
      return (
        <ViewTransition update="slide-up">
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    await act(() => {
      startTransition(() => {
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('accepts a string as the enter class', async () => {
    function App({show}) {
      if (!show) return null;
      return (
        <ViewTransition enter="slide-in">
          <div id="child">Entered</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App show={false} />);
    });

    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Entered');
  });

  // @gate enableViewTransition
  it('accepts a string as the exit class', async () => {
    function App({show}) {
      if (!show) return null;
      return (
        <ViewTransition exit="slide-out">
          <div id="child">Will Exit</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Will Exit');

    await act(() => {
      startTransition(() => {
        root.render(<App show={false} />);
      });
    });

    expect(container.querySelector('#child')).toBe(null);
  });

  // @gate enableViewTransition
  it('accepts a string as the share class', async () => {
    function App({page}) {
      if (page === 'a') {
        return (
          <ViewTransition key="a" name="hero" share="morph">
            <div id="page-a">Page A</div>
          </ViewTransition>
        );
      }
      return (
        <ViewTransition key="b" name="hero" share="morph">
          <div id="page-b">Page B</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App page="a" />);
      });
    });

    expect(container.querySelector('#page-a')).not.toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App page="b" />);
      });
    });

    expect(container.querySelector('#page-b')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('accepts an object with default key as the class', async () => {
    function App() {
      return (
        <ViewTransition update={{default: 'fade'}}>
          <div id="child">Object class</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#child')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('accepts an object with transition type keys', async () => {
    function App({text}) {
      return (
        <ViewTransition
          update={{
            'nav-forward': 'slide-left',
            'nav-back': 'slide-right',
            default: 'fade',
          }}>
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    await act(() => {
      startTransition(() => {
        addTransitionType('nav-forward');
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('handles "none" class which suppresses the transition', async () => {
    function App({text}) {
      return (
        <ViewTransition update="none">
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    await act(() => {
      startTransition(() => {
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('handles "none" in object class which takes precedence', async () => {
    function App({text}) {
      return (
        <ViewTransition
          update={{
            'nav-forward': 'none',
            'nav-back': 'slide-right',
            default: 'fade',
          }}>
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    // When nav-forward type is active, "none" should take precedence
    await act(() => {
      startTransition(() => {
        addTransitionType('nav-forward');
        addTransitionType('nav-back');
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('handles "auto" class which means use default behavior', async () => {
    function App({text}) {
      return (
        <ViewTransition update="auto">
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    await act(() => {
      startTransition(() => {
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('combines multiple matching transition type classes', async () => {
    function App({text}) {
      return (
        <ViewTransition
          update={{
            highlight: 'glow',
            important: 'bold',
            default: 'fade',
          }}>
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    // When multiple types match, their classes should be combined
    await act(() => {
      startTransition(() => {
        addTransitionType('highlight');
        addTransitionType('important');
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('falls back to default when no transition types match', async () => {
    function App({text}) {
      return (
        <ViewTransition
          update={{
            'nav-forward': 'slide-left',
            default: 'crossfade',
          }}>
          <div id="child">{text}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App text="First" />);
      });
    });

    // No transition type added, should fall back to default
    await act(() => {
      startTransition(() => {
        root.render(<App text="Second" />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Second');
  });

  // @gate enableViewTransition
  it('event class overrides default class', async () => {
    function App({show}) {
      if (!show) return null;
      return (
        <ViewTransition default="base-class" enter="enter-class">
          <div id="child">Content</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App show={false} />);
    });

    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Content');
  });

  // @gate enableViewTransition
  it('event class "auto" nullifies the class', async () => {
    function App({show}) {
      if (!show) return null;
      return (
        <ViewTransition default="base-class" enter="auto">
          <div id="child">Content</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App show={false} />);
    });

    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#child').textContent).toBe('Content');
  });

  // @gate enableViewTransition
  it('supports different classes for enter, exit, update, and share', async () => {
    function PageA() {
      return (
        <ViewTransition
          name="page"
          enter="page-enter"
          exit="page-exit"
          update="page-update"
          share="page-share">
          <div id="page-a">Page A Content</div>
        </ViewTransition>
      );
    }

    function PageB() {
      return (
        <ViewTransition
          name="page"
          enter="page-enter"
          exit="page-exit"
          update="page-update"
          share="page-share">
          <div id="page-b">Page B Content</div>
        </ViewTransition>
      );
    }

    function App({page}) {
      return page === 'a' ? <PageA key="a" /> : <PageB key="b" />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App page="a" />);
      });
    });

    expect(container.querySelector('#page-a')).not.toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App page="b" />);
      });
    });

    expect(container.querySelector('#page-b')).not.toBe(null);
    expect(container.querySelector('#page-a')).toBe(null);
  });
});
