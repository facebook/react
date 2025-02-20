/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails reactcore
 */

'use strict';

let React;
let ReactDOMClient;
let act;
let container;

describe('FragmentRefs', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    container = document.createElement('div');
  });

  // @gate enableFragmentRefs
  it('attaches a ref to Fragment', async () => {
    const fragmentRef = React.createRef();
    const root = ReactDOMClient.createRoot(container);

    await act(() =>
      root.render(
        <div id="parent">
          <React.Fragment ref={fragmentRef}>
            <div id="child">Hi</div>
          </React.Fragment>
        </div>,
      ),
    );
    expect(container.innerHTML).toEqual(
      '<div id="parent"><div id="child">Hi</div></div>',
    );

    expect(fragmentRef.current).not.toBe(null);
  });

  // @gate enableFragmentRefs
  it('tracks added and removed children', async () => {
    let addChild;
    let removeChild;
    const fragmentRef = React.createRef();

    function Test() {
      const [extraChildCount, setExtraChildCount] = React.useState(0);
      addChild = () => {
        setExtraChildCount(prev => prev + 1);
      };
      removeChild = () => {
        setExtraChildCount(prev => prev - 1);
      };

      return (
        <div id="root">
          <React.Fragment ref={fragmentRef}>
            {Array.from({length: extraChildCount}).map((_, index) => (
              <div id={'extra-child-' + index} key={index}>
                Extra Child {index}
              </div>
            ))}
          </React.Fragment>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<Test />));
    expect(fragmentRef.current._children.size).toBe(0);
    await act(() => addChild());
    expect(fragmentRef.current._children.size).toBe(1);
    await act(() => removeChild());
    expect(fragmentRef.current._children.size).toBe(0);
  });

  // @gate enableFragmentRefs
  it('tracks nested host children', async () => {
    const fragmentRef = React.createRef();
    const root = ReactDOMClient.createRoot(container);

    function Wrapper({children}) {
      return children;
    }

    await act(() => {
      root.render(
        <React.Fragment ref={fragmentRef}>
          <Wrapper>
            <div id="child-a" />
          </Wrapper>
          <Wrapper>
            <div id="child-b" />
            <Wrapper>
              <div id="child-c">
                <div id="child-nested" />
              </div>
            </Wrapper>
          </Wrapper>
          <Wrapper>
            <div id="child-d" />
          </Wrapper>
          <div id="child-e" />
        </React.Fragment>,
      );
    });

    expect(fragmentRef.current._children.size).toBe(5);
  });

  // @gate enableFragmentRefs
  it('can share tracked children with nested fragment instances', async () => {
    const fragmentRefA = React.createRef();
    const fragmentRefB = React.createRef();
    const root = ReactDOMClient.createRoot(container);

    function Test({showB}) {
      return (
        <React.Fragment ref={fragmentRefA}>
          <div id="child-a" />
          <React.Fragment ref={fragmentRefB}>
            <div id="child-b" />
            {showB && <div id="child-c" />}
          </React.Fragment>
        </React.Fragment>
      );
    }

    await act(() => root.render(<Test showB={false} />));

    expect(fragmentRefA.current._children.size).toBe(2);
    expect(fragmentRefB.current._children.size).toBe(1);

    await act(() => root.render(<Test showB={true} />));

    expect(fragmentRefA.current._children.size).toBe(3);
    expect(fragmentRefB.current._children.size).toBe(2);

    await act(() => root.render(<Test showB={false} />));

    expect(fragmentRefA.current._children.size).toBe(2);
    expect(fragmentRefB.current._children.size).toBe(1);
  });

  // @gate enableFragmentRefs
  it('handles empty children', async () => {
    const fragmentRef = React.createRef();
    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(<React.Fragment ref={fragmentRef} />);
    });

    expect(fragmentRef.current._children.size).toBe(0);
  });

  // @gate enableFragmentRefs
  it('accepts a ref callback', async () => {
    let fragmentRef;
    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(
        <React.Fragment ref={ref => (fragmentRef = ref)}>
          <div id="child">Hi</div>
        </React.Fragment>,
      );
    });

    expect(fragmentRef._children.size).toBe(1);
  });

  // @gate enableFragmentRefs
  it('is available in effects', async () => {
    function Test() {
      const fragmentRef = React.useRef(null);
      React.useLayoutEffect(() => {
        expect(fragmentRef.current).not.toBe(null);
      });
      React.useEffect(() => {
        expect(fragmentRef.current).not.toBe(null);
      });
      return (
        <React.Fragment ref={fragmentRef}>
          <div />
        </React.Fragment>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<Test />));
  });

  describe('event listeners', () => {
    // @gate enableFragmentRefs
    it('adds and removes event listeners from children', async () => {
      const parentRef = React.createRef();
      const fragmentRef = React.createRef();
      const childARef = React.createRef();
      const childBRef = React.createRef();
      const root = ReactDOMClient.createRoot(container);

      let logs = [];

      function handleFragmentRefClicks() {
        logs.push('fragmentRef');
      }

      function Test() {
        React.useEffect(() => {
          fragmentRef.current.addEventListener(
            'click',
            handleFragmentRefClicks,
          );

          return () => {
            // TODO: This is a noop here because the tracked child nodes were deleted and they
            // remove their own event listeners. Decide if we want to change the timing of this.
            // instance._children is currently empty at this point.
            fragmentRef.current.removeEventListener(
              'click',
              handleFragmentRefClicks,
            );
          };
        }, []);
        return (
          <div ref={parentRef}>
            <React.Fragment ref={fragmentRef}>
              <div ref={childARef}>A</div>
              <div ref={childBRef}>B</div>
            </React.Fragment>
          </div>
        );
      }

      await act(() => {
        root.render(<Test />);
      });

      childARef.current.addEventListener('click', () => {
        logs.push('A');
      });

      childBRef.current.addEventListener('click', () => {
        logs.push('B');
      });

      // Clicking on the parent should not trigger any listeners
      parentRef.current.click();
      expect(logs).toEqual([]);

      // Clicking a child triggers its own listeners and the Fragment's
      childARef.current.click();
      expect(logs).toEqual(['fragmentRef', 'A']);

      logs = [];

      childBRef.current.click();
      expect(logs).toEqual(['fragmentRef', 'B']);

      logs = [];

      fragmentRef.current.removeEventListener('click', handleFragmentRefClicks);

      childARef.current.click();
      expect(logs).toEqual(['A']);

      logs = [];

      childBRef.current.click();
      expect(logs).toEqual(['B']);
    });

    // @gate enableFragmentRefs
    it('adds and removes event listeners from children with multiple fragments', async () => {
      const fragmentRef = React.createRef();
      const nestedFragmentRef = React.createRef();
      const childARef = React.createRef();
      const childBRef = React.createRef();
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(
          <div>
            <React.Fragment ref={fragmentRef}>
              <div ref={childARef}>A</div>
              <div>
                <React.Fragment ref={nestedFragmentRef}>
                  <div ref={childBRef}>B</div>
                </React.Fragment>
              </div>
            </React.Fragment>
          </div>,
        );
      });

      let logs = [];

      function handleFragmentRefClicks() {
        logs.push('fragmentRef');
      }

      function handleNestedFragmentRefClicks() {
        logs.push('nestedFragmentRef');
      }

      fragmentRef.current.addEventListener('click', handleFragmentRefClicks);
      nestedFragmentRef.current.addEventListener(
        'click',
        handleNestedFragmentRefClicks,
      );

      childBRef.current.click();
      // Event bubbles to the parent fragment
      expect(logs).toEqual(['nestedFragmentRef', 'fragmentRef']);

      logs = [];

      childARef.current.click();
      expect(logs).toEqual(['fragmentRef']);

      logs = [];

      fragmentRef.current.removeEventListener('click', handleFragmentRefClicks);
      nestedFragmentRef.current.removeEventListener(
        'click',
        handleNestedFragmentRefClicks,
      );
      childBRef.current.click();
      expect(logs).toEqual([]);
    });

    // @gate enableFragmentRefs
    it('adds an event listener to a newly added child', async () => {
      const fragmentRef = React.createRef();
      const childRef = React.createRef();
      const root = ReactDOMClient.createRoot(container);
      let showChild;

      function Component() {
        const [shouldShowChild, setShouldShowChild] = React.useState(false);
        showChild = () => {
          setShouldShowChild(true);
        };

        return (
          <div>
            <React.Fragment ref={fragmentRef}>
              <div id="a">A</div>
              {shouldShowChild && (
                <div ref={childRef} id="b">
                  B
                </div>
              )}
            </React.Fragment>
          </div>
        );
      }

      await act(() => {
        root.render(<Component />);
      });

      expect(fragmentRef.current).not.toBe(null);
      expect(childRef.current).toBe(null);

      let hasClicked = false;
      fragmentRef.current.addEventListener('click', () => {
        hasClicked = true;
      });

      await act(() => {
        showChild();
      });
      expect(childRef.current).not.toBe(null);

      childRef.current.click();
      expect(hasClicked).toBe(true);
    });

    // @gate enableFragmentRefs
    it('applies event listeners to host children nested within non-host children', async () => {
      const fragmentRef = React.createRef();
      const childRef = React.createRef();
      const nestedChildRef = React.createRef();
      const root = ReactDOMClient.createRoot(container);

      function Wrapper({children}) {
        return children;
      }

      await act(() => {
        root.render(
          <div>
            <React.Fragment ref={fragmentRef}>
              <div ref={childRef}>Host A</div>
              <Wrapper>
                <Wrapper>
                  <Wrapper>
                    <div ref={nestedChildRef}>Host B</div>
                  </Wrapper>
                </Wrapper>
              </Wrapper>
            </React.Fragment>
          </div>,
        );
      });
      const logs = [];
      fragmentRef.current.addEventListener('click', e => {
        logs.push(e.target.textContent);
      });

      expect(logs).toEqual([]);
      childRef.current.click();
      expect(logs).toEqual(['Host A']);
      nestedChildRef.current.click();
      expect(logs).toEqual(['Host A', 'Host B']);
    });
  });
});
