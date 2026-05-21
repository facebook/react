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
let Suspense;
let act;
let startTransition;
let addTransitionType;
let container;

describe('ReactDOMViewTransitionWarnings', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    ViewTransition = React.ViewTransition;
    Suspense = React.Suspense;
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

  // @gate enableViewTransition && __DEV__
  it('warns when two ViewTransitions have the same name', async () => {
    function App() {
      return (
        <div>
          <ViewTransition name="duplicate">
            <div id="first">First</div>
          </ViewTransition>
          <ViewTransition name="duplicate">
            <div id="second">Second</div>
          </ViewTransition>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        startTransition(() => {
          root.render(<App />);
        });
      });
    }).toErrorDev([
      'There are two <ViewTransition name="duplicate"> components with the same name',
      'The existing <ViewTransition name="duplicate"> duplicate has this stack trace',
    ]);
  });

  // @gate enableViewTransition && __DEV__
  it('does not warn for "auto" name duplicates', async () => {
    function App() {
      return (
        <div>
          <ViewTransition name="auto">
            <div id="first">First</div>
          </ViewTransition>
          <ViewTransition name="auto">
            <div id="second">Second</div>
          </ViewTransition>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    // Should not produce any warnings
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#first')).not.toBe(null);
    expect(container.querySelector('#second')).not.toBe(null);
  });

  // @gate enableViewTransition && __DEV__
  it('does not warn for unnamed ViewTransitions', async () => {
    function App() {
      return (
        <div>
          <ViewTransition>
            <div id="first">First</div>
          </ViewTransition>
          <ViewTransition>
            <div id="second">Second</div>
          </ViewTransition>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    // Should not produce any warnings
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    expect(container.querySelector('#first')).not.toBe(null);
    expect(container.querySelector('#second')).not.toBe(null);
  });

  // @gate enableViewTransition && __DEV__
  it('does not warn when duplicate is unmounted before new one mounts', async () => {
    function App({page}) {
      if (page === 'a') {
        return (
          <ViewTransition name="hero">
            <div id="page-a">Page A</div>
          </ViewTransition>
        );
      }
      return (
        <ViewTransition name="hero">
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

    // Switching pages should not warn because old one unmounts
    await act(() => {
      startTransition(() => {
        root.render(<App page="b" />);
      });
    });

    expect(container.querySelector('#page-b')).not.toBe(null);
  });

  // @gate enableViewTransition && __DEV__
  it('only warns once per duplicate name', async () => {
    function App({count}) {
      const items = [];
      for (let i = 0; i < count; i++) {
        items.push(
          <ViewTransition key={i} name="repeated">
            <div>{i}</div>
          </ViewTransition>,
        );
      }
      return <div>{items}</div>;
    }

    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        startTransition(() => {
          root.render(<App count={3} />);
        });
      });
    }).toErrorDev([
      'There are two <ViewTransition name="repeated"> components with the same name',
      'The existing <ViewTransition name="repeated"> duplicate has this stack trace',
    ]);

    // Adding more duplicates should not warn again
    await act(() => {
      startTransition(() => {
        root.render(<App count={5} />);
      });
    });
  });

  // @gate enableViewTransition
  it('supports different unique names without warnings', async () => {
    function App() {
      return (
        <div>
          <ViewTransition name="header">
            <header id="header">Header</header>
          </ViewTransition>
          <ViewTransition name="main">
            <main id="main">Main</main>
          </ViewTransition>
          <ViewTransition name="footer">
            <footer id="footer">Footer</footer>
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

    expect(container.querySelector('#header').textContent).toBe('Header');
    expect(container.querySelector('#main').textContent).toBe('Main');
    expect(container.querySelector('#footer').textContent).toBe('Footer');
  });
});

describe('ReactDOMViewTransitionEdgeCases', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    ViewTransition = React.ViewTransition;
    Suspense = React.Suspense;
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
  it('handles rapid mount/unmount cycles', async () => {
    function App({show}) {
      if (!show) return null;
      return (
        <ViewTransition name="rapid">
          <div id="rapid">Rapid</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);

    // Rapid mount/unmount
    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });
    await act(() => {
      startTransition(() => {
        root.render(<App show={false} />);
      });
    });
    await act(() => {
      startTransition(() => {
        root.render(<App show={true} />);
      });
    });

    expect(container.querySelector('#rapid')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('handles ViewTransition with null children', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="wrapper">{null}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('#wrapper')).not.toBe(null);
    expect(container.querySelector('#wrapper').textContent).toBe('');
  });

  // @gate enableViewTransition
  it('handles ViewTransition with text children', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="text-child">Just text content</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('#text-child').textContent).toBe(
      'Just text content',
    );
  });

  // @gate enableViewTransition
  it('handles ViewTransition with multiple DOM children', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="multi-parent">
            <span>One</span>
            <span>Two</span>
            <span>Three</span>
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    const parent = container.querySelector('#multi-parent');
    expect(parent.children.length).toBe(3);
    expect(parent.children[0].textContent).toBe('One');
    expect(parent.children[1].textContent).toBe('Two');
    expect(parent.children[2].textContent).toBe('Three');
  });

  // @gate enableViewTransition
  it('handles ViewTransition inside a list', async () => {
    function App({items}) {
      return (
        <ul>
          {items.map(item => (
            <ViewTransition key={item.id} name={`item-${item.id}`}>
              <li id={`item-${item.id}`}>{item.text}</li>
            </ViewTransition>
          ))}
        </ul>
      );
    }

    const items = [
      {id: 1, text: 'Apple'},
      {id: 2, text: 'Banana'},
      {id: 3, text: 'Cherry'},
    ];

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App items={items} />);
      });
    });

    expect(container.querySelector('#item-1').textContent).toBe('Apple');
    expect(container.querySelector('#item-2').textContent).toBe('Banana');
    expect(container.querySelector('#item-3').textContent).toBe('Cherry');

    // Reorder items
    const reordered = [items[2], items[0], items[1]];
    await act(() => {
      startTransition(() => {
        root.render(<App items={reordered} />);
      });
    });

    const listItems = container.querySelectorAll('li');
    expect(listItems[0].textContent).toBe('Cherry');
    expect(listItems[1].textContent).toBe('Apple');
    expect(listItems[2].textContent).toBe('Banana');
  });

  // @gate enableViewTransition
  it('handles adding items to a list with ViewTransitions', async () => {
    function App({items}) {
      return (
        <ul>
          {items.map(item => (
            <ViewTransition key={item} name={`list-${item}`}>
              <li id={`list-${item}`}>{item}</li>
            </ViewTransition>
          ))}
        </ul>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App items={['a', 'b']} />);
      });
    });

    expect(container.querySelectorAll('li').length).toBe(2);

    await act(() => {
      startTransition(() => {
        root.render(<App items={['a', 'b', 'c', 'd']} />);
      });
    });

    expect(container.querySelectorAll('li').length).toBe(4);
    expect(container.querySelector('#list-c').textContent).toBe('c');
    expect(container.querySelector('#list-d').textContent).toBe('d');
  });

  // @gate enableViewTransition
  it('handles removing items from a list with ViewTransitions', async () => {
    function App({items}) {
      return (
        <ul>
          {items.map(item => (
            <ViewTransition key={item} name={`rm-${item}`}>
              <li id={`rm-${item}`}>{item}</li>
            </ViewTransition>
          ))}
        </ul>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App items={['x', 'y', 'z']} />);
      });
    });

    expect(container.querySelectorAll('li').length).toBe(3);

    await act(() => {
      startTransition(() => {
        root.render(<App items={['x']} />);
      });
    });

    expect(container.querySelectorAll('li').length).toBe(1);
    expect(container.querySelector('#rm-x').textContent).toBe('x');
    expect(container.querySelector('#rm-y')).toBe(null);
    expect(container.querySelector('#rm-z')).toBe(null);
  });

  // @gate enableViewTransition
  it('handles ViewTransition with Suspense fallback', async () => {
    let resolve;
    const promise = new Promise(r => (resolve = r));

    function AsyncChild() {
      return React.use(promise);
    }

    function App() {
      return (
        <ViewTransition>
          <Suspense fallback={<div id="fallback">Loading...</div>}>
            <AsyncChild />
          </Suspense>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });

    // Should show fallback
    expect(container.querySelector('#fallback')).not.toBe(null);

    // Resolve the promise
    await act(async () => {
      resolve(<div id="resolved">Loaded!</div>);
    });

    expect(container.querySelector('#resolved')).not.toBe(null);
    expect(container.querySelector('#fallback')).toBe(null);
  });

  // @gate enableViewTransition
  it('handles ViewTransition with key change', async () => {
    function App({id}) {
      return (
        <ViewTransition key={id} name={`card-${id}`}>
          <div id={`card-${id}`}>Card {id}</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App id="1" />);
      });
    });

    expect(container.querySelector('#card-1')).not.toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App id="2" />);
      });
    });

    expect(container.querySelector('#card-2')).not.toBe(null);
    expect(container.querySelector('#card-1')).toBe(null);
  });

  // @gate enableViewTransition
  it('handles ViewTransition name change on same component', async () => {
    function App({name}) {
      return (
        <ViewTransition name={name}>
          <div id="named">Named transition</div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      startTransition(() => {
        root.render(<App name="first-name" />);
      });
    });

    expect(container.querySelector('#named')).not.toBe(null);

    await act(() => {
      startTransition(() => {
        root.render(<App name="second-name" />);
      });
    });

    expect(container.querySelector('#named')).not.toBe(null);
  });

  // @gate enableViewTransition
  it('handles deeply nested ViewTransitions', async () => {
    function App() {
      return (
        <ViewTransition name="level-1">
          <div id="l1">
            <ViewTransition name="level-2">
              <div id="l2">
                <ViewTransition name="level-3">
                  <div id="l3">Deep</div>
                </ViewTransition>
              </div>
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

    expect(container.querySelector('#l1')).not.toBe(null);
    expect(container.querySelector('#l2')).not.toBe(null);
    expect(container.querySelector('#l3').textContent).toBe('Deep');
  });

  // @gate enableViewTransition
  it('handles ViewTransition with Fragment children', async () => {
    function App() {
      return (
        <ViewTransition>
          <div id="frag-parent">
            <>
              <span>Fragment child 1</span>
              <span>Fragment child 2</span>
            </>
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    const parent = container.querySelector('#frag-parent');
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].textContent).toBe('Fragment child 1');
    expect(parent.children[1].textContent).toBe('Fragment child 2');
  });

  // @gate enableViewTransition
  it('handles ViewTransition with component children', async () => {
    function Child({text}) {
      return <span id="comp-child">{text}</span>;
    }

    function App() {
      return (
        <ViewTransition>
          <div>
            <Child text="Component child" />
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('#comp-child').textContent).toBe(
      'Component child',
    );
  });

  // @gate enableViewTransition
  it('handles ViewTransition with memo component', async () => {
    const MemoChild = React.memo(function MemoChild({text}) {
      return <div id="memo-child">{text}</div>;
    });

    function App({text}) {
      return (
        <ViewTransition>
          <div>
            <MemoChild text={text} />
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App text="Memoized" />);
    });

    expect(container.querySelector('#memo-child').textContent).toBe(
      'Memoized',
    );

    await act(() => {
      startTransition(() => {
        root.render(<App text="Updated" />);
      });
    });

    expect(container.querySelector('#memo-child').textContent).toBe('Updated');
  });

  // @gate enableViewTransition
  it('handles ViewTransition with forwardRef component', async () => {
    const RefChild = React.forwardRef(function RefChild(props, ref) {
      return (
        <div id="ref-child" ref={ref}>
          {props.text}
        </div>
      );
    });

    function App() {
      const ref = React.useRef(null);
      return (
        <ViewTransition>
          <div>
            <RefChild ref={ref} text="With ref" />
          </div>
        </ViewTransition>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('#ref-child').textContent).toBe('With ref');
  });
});
