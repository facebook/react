/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactDOM;
let ReactDOMServer;
let Scheduler;

function dispatchClickEvent(element) {
  const event = document.createEvent('Event');
  event.initEvent('click', true, true);
  element.dispatchEvent(event);
}

describe('DOMModernPluginEventSystem', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableModernEventSystem = true;

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    ReactDOMServer = require('react-dom/server');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('handle propagation of click events', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];
    const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Test() {
      return (
        <button
          ref={buttonRef}
          onClick={onClick}
          onClickCapture={onClickCapture}>
          <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
            Click me!
          </div>
        </button>
      );
    }

    ReactDOM.render(<Test />, container);

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Child() {
      return (
        <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Child() {
      return (
        <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
    dispatchClickEvent(divElement);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(onClickCapture).toHaveBeenCalledTimes(3);
    expect(log[2]).toEqual(['capture', divElement]);
    expect(log[3]).toEqual(['bubble', divElement]);
    expect(log[4]).toEqual(['capture', buttonElement]);
    expect(log[5]).toEqual(['bubble', buttonElement]);
  });

  it('handle propagation of click events between disjointed comment roots', () => {
    const buttonRef = React.createRef();
    const divRef = React.createRef();
    const log = [];
    const onClick = jest.fn(e => log.push(['bubble', e.currentTarget]));
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Child() {
      return (
        <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    function Child() {
      return (
        <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    const portalElement = document.createElement('div');
    document.body.appendChild(portalElement);

    function Child() {
      return (
        <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
          {ReactDOM.createPortal(<Child label={'first'} />, document.body)}
          {ReactDOM.createPortal(<Child label={'second'} />, document.body)}
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

  it.experimental(
    'does not invoke an event on a parent tree when a subtree is dehydrated',
    async () => {
      let suspend = false;
      let resolve;
      let promise = new Promise(resolvePromise => (resolve = resolvePromise));

      let clicks = 0;
      let childSlotRef = React.createRef();

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
      let finalHTML = ReactDOMServer.renderToString(<App />);

      let parentContainer = document.createElement('div');
      let childContainer = document.createElement('div');

      // We need this to be in the document since we'll dispatch events on it.
      document.body.appendChild(parentContainer);

      // We're going to use a different root as a parent.
      // This lets us detect whether an event goes through React's event system.
      let parentRoot = ReactDOM.createRoot(parentContainer);
      parentRoot.render(<Parent />);
      Scheduler.unstable_flushAll();

      childSlotRef.current.appendChild(childContainer);

      childContainer.innerHTML = finalHTML;

      let a = childContainer.getElementsByTagName('a')[0];

      suspend = true;

      // Hydrate asynchronously.
      let root = ReactDOM.createRoot(childContainer, {hydrate: true});
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
    },
  );

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
    const onClickCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

    const portalElement = document.createElement('div');
    document.body.appendChild(portalElement);

    function Child() {
      return (
        <div ref={middelDivRef}>
          <div ref={divRef} onClick={onClick} onClickCapture={onClickCapture}>
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

    let buttonElement = buttonRef.current;
    dispatchClickEvent(buttonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onFocusCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

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

    let buttonElement = buttonRef.current;
    buttonElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onFocusCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

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

    let buttonElement = buttonRef.current;
    buttonElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onFocusCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

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

    let buttonElement = buttonRef.current;
    buttonElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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
    const onFocusCapture = jest.fn(e => log.push(['capture', e.currentTarget]));

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

    let buttonElement = buttonRef.current;
    buttonElement.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    expect(log[0]).toEqual(['capture', buttonElement]);
    expect(log[1]).toEqual(['bubble', buttonElement]);

    let divElement = divRef.current;
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

    let buttonElement = buttonRef.current;
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

    let divElement = divRef.current;
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

    let buttonElement = buttonRef.current;
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

    let divElement = divRef.current;
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
});
