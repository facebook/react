/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMTestSelectors', () => {
  let React;

  let act;
  let createComponentSelector;
  let createHasPseudoClassSelector;
  let createRoleSelector;
  let createTextSelector;
  let createTestNameSelector;
  let findAllNodes;
  let findBoundingRects;
  let focusWithin;
  let getFindAllNodesFailureDescription;
  let observeVisibleRects;
  let render;

  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    act = React.unstable_act;

    if (__EXPERIMENTAL__ || global.__WWW__) {
      const ReactDOM = require('react-dom/unstable_testing');
      createComponentSelector = ReactDOM.createComponentSelector;
      createHasPseudoClassSelector = ReactDOM.createHasPseudoClassSelector;
      createRoleSelector = ReactDOM.createRoleSelector;
      createTextSelector = ReactDOM.createTextSelector;
      createTestNameSelector = ReactDOM.createTestNameSelector;
      findAllNodes = ReactDOM.findAllNodes;
      findBoundingRects = ReactDOM.findBoundingRects;
      focusWithin = ReactDOM.focusWithin;
      getFindAllNodesFailureDescription =
        ReactDOM.getFindAllNodesFailureDescription;
      observeVisibleRects = ReactDOM.observeVisibleRects;
      render = ReactDOM.render;
    }

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('findAllNodes', () => {
    // @gate www || experimental
    it('should support searching from the document root', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support searching from the container', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(container, [
        createComponentSelector(Example),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support searching from a previous match if the match had a data-testname', () => {
      function Outer() {
        return (
          <div data-testname="outer" id="outer">
            <Inner />
          </div>
        );
      }

      function Inner() {
        return <div data-testname="inner" id="inner" />;
      }

      render(<Outer />, container);

      let matches = findAllNodes(container, [
        createComponentSelector(Outer),
        createTestNameSelector('outer'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('outer');

      matches = findAllNodes(matches[0], [
        createComponentSelector(Inner),
        createTestNameSelector('inner'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('inner');
    });

    // @gate www || experimental
    it('should not support searching from a previous match if the match did not have a data-testname', () => {
      function Outer() {
        return (
          <div id="outer">
            <Inner />
          </div>
        );
      }

      function Inner() {
        return <div id="inner" />;
      }

      render(<Outer />, container);

      const matches = findAllNodes(container, [createComponentSelector(Outer)]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('outer');

      expect(() => {
        findAllNodes(matches[0], [
          createComponentSelector(Inner),
          createTestNameSelector('inner'),
        ]);
      }).toThrow(
        'Invalid host root specified. Should be either a React container or a node with a testname attribute.',
      );
    });

    // @gate www || experimental
    it('should support an multiple component types in the selector array', () => {
      function Outer() {
        return (
          <>
            <div data-testname="match" id="match1" />
            <Middle />
          </>
        );
      }
      function Middle() {
        return (
          <>
            <div data-testname="match" id="match2" />
            <Inner />
          </>
        );
      }
      function Inner() {
        return (
          <>
            <div data-testname="match" id="match3" />
          </>
        );
      }

      render(<Outer />, container);

      let matches = findAllNodes(document.body, [
        createComponentSelector(Outer),
        createComponentSelector(Middle),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(2);
      expect(matches.map(m => m.id).sort()).toEqual(['match2', 'match3']);

      matches = findAllNodes(document.body, [
        createComponentSelector(Outer),
        createComponentSelector(Middle),
        createComponentSelector(Inner),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match3');

      matches = findAllNodes(document.body, [
        createComponentSelector(Outer),
        createComponentSelector(Inner),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match3');
    });

    // @gate www || experimental
    it('should find multiple matches', () => {
      function Example1() {
        return (
          <div>
            <div data-testname="match" id="match1" />
          </div>
        );
      }

      function Example2() {
        return (
          <div>
            <div data-testname="match" id="match2" />
            <div data-testname="match" id="match3" />
          </div>
        );
      }

      render(
        <>
          <Example1 />
          <Example2 />
        </>,
        container,
      );

      const matches = findAllNodes(document.body, [
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(3);
      expect(matches.map(m => m.id).sort()).toEqual([
        'match1',
        'match2',
        'match3',
      ]);
    });

    // @gate www || experimental
    it('should ignore nested matches', () => {
      function Example() {
        return (
          <div data-testname="match" id="match1">
            <div data-testname="match" id="match2" />
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createTestNameSelector('match'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toEqual('match1');
    });

    // @gate www || experimental
    it('should enforce the specific order of selectors', () => {
      function Outer() {
        return (
          <>
            <div data-testname="match" id="match1" />
            <Inner />
          </>
        );
      }
      function Inner() {
        return <div data-testname="match" id="match1" />;
      }

      render(<Outer />, container);

      expect(
        findAllNodes(document.body, [
          createComponentSelector(Inner),
          createComponentSelector(Outer),
          createTestNameSelector('match'),
        ]),
      ).toHaveLength(0);
    });

    // @gate www || experimental
    it('should not search within hidden subtrees', () => {
      const ref1 = React.createRef(null);
      const ref2 = React.createRef(null);

      function Outer() {
        return (
          <>
            <div hidden={true}>
              <div ref={ref1} data-testname="match" />
            </div>
            <Inner />
          </>
        );
      }
      function Inner() {
        return <div ref={ref2} data-testname="match" />;
      }

      render(<Outer />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Outer),
        createTestNameSelector('match'),
      ]);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(ref2.current);
    });

    // @gate www || experimental
    it('should support filtering by display text', () => {
      function Example() {
        return (
          <div>
            <div>foo</div>
            <div>
              <div id="match">bar</div>
            </div>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createTextSelector('bar'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support filtering by explicit accessibiliy role', () => {
      function Example() {
        return (
          <div>
            <div>foo</div>
            <div>
              <div role="button" id="match">
                bar
              </div>
            </div>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createRoleSelector('button'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support filtering by explicit secondary accessibiliy role', () => {
      const ref = React.createRef();

      function Example() {
        return (
          <div>
            <div>foo</div>
            <div>
              <div ref={ref} role="meter progressbar" />
            </div>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createRoleSelector('progressbar'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(ref.current);
    });

    // @gate www || experimental
    it('should support filtering by implicit accessibiliy role', () => {
      function Example() {
        return (
          <div>
            <div>foo</div>
            <div>
              <button id="match">bar</button>
            </div>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createRoleSelector('button'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support filtering by implicit accessibiliy role with attributes qualifications', () => {
      function Example() {
        return (
          <div>
            <div>foo</div>
            <div>
              <input type="checkbox" id="match" value="bar" />
            </div>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createRoleSelector('checkbox'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should support searching ahead with the has() selector', () => {
      function Example() {
        return (
          <div>
            <article>
              <h1>Should match</h1>
              <p>
                <button id="match">Like</button>
              </p>
            </article>
            <article>
              <h1>Should not match</h1>
              <p>
                <button>Like</button>
              </p>
            </article>
          </div>
        );
      }

      render(<Example />, container);

      const matches = findAllNodes(document.body, [
        createComponentSelector(Example),
        createRoleSelector('article'),
        createHasPseudoClassSelector([
          createRoleSelector('heading'),
          createTextSelector('Should match'),
        ]),
        createRoleSelector('button'),
      ]);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    // @gate www || experimental
    it('should throw if no container can be found', () => {
      expect(() => findAllNodes(document.body, [])).toThrow(
        'Could not find React container within specified host subtree.',
      );
    });

    // @gate www || experimental
    it('should throw if an invalid host root is specified', () => {
      const ref = React.createRef();
      function Example() {
        return <div ref={ref} />;
      }

      render(<Example />, container);

      expect(() => findAllNodes(ref.current, [])).toThrow(
        'Invalid host root specified. Should be either a React container or a node with a testname attribute.',
      );
    });
  });

  describe('getFindAllNodesFailureDescription', () => {
    // @gate www || experimental
    it('should describe findAllNodes failures caused by the component type selector', () => {
      function Outer() {
        return <Middle />;
      }
      function Middle() {
        return <div />;
      }
      function NotRendered() {
        return <div data-testname="match" />;
      }

      render(<Outer />, container);

      const description = getFindAllNodesFailureDescription(document.body, [
        createComponentSelector(Outer),
        createComponentSelector(Middle),
        createComponentSelector(NotRendered),
        createTestNameSelector('match'),
      ]);

      expect(description).toEqual(
        `findAllNodes was able to match part of the selector:
  <Outer> > <Middle>

No matching component was found for:
  <NotRendered> > [data-testname="match"]`,
      );
    });

    // @gate www || experimental
    it('should return null if findAllNodes was able to find a match', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      render(<Example />, container);

      const description = getFindAllNodesFailureDescription(document.body, [
        createComponentSelector(Example),
      ]);

      expect(description).toBe(null);
    });
  });

  describe('findBoundingRects', () => {
    // Stub out getBoundingClientRect for the specified target.
    // This API is required by the test selectors but it isn't implemented by jsdom.
    function setBoundingClientRect(target, {x, y, width, height}) {
      target.getBoundingClientRect = function () {
        return {
          width,
          height,
          left: x,
          right: x + width,
          top: y,
          bottom: y + height,
        };
      };
    }

    // @gate www || experimental
    it('should return a single rect for a component that returns a single root host element', () => {
      const ref = React.createRef();

      function Example() {
        return (
          <div ref={ref}>
            <div />
            <div />
          </div>
        );
      }

      render(<Example />, container);

      setBoundingClientRect(ref.current, {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Example),
      ]);
      expect(rects).toHaveLength(1);
      expect(rects).toContainEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
    });

    // @gate www || experimental
    it('should return a multiple rects for multiple matches', () => {
      const outerRef = React.createRef();
      const innerRef = React.createRef();

      function Outer() {
        return (
          <>
            <div ref={outerRef} />
            <Inner />
          </>
        );
      }
      function Inner() {
        return <div ref={innerRef} />;
      }

      render(<Outer />, container);

      setBoundingClientRect(outerRef.current, {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
      setBoundingClientRect(innerRef.current, {
        x: 110,
        y: 120,
        width: 250,
        height: 150,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Outer),
      ]);
      expect(rects).toHaveLength(2);
      expect(rects).toContainEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
      expect(rects).toContainEqual({
        x: 110,
        y: 120,
        width: 250,
        height: 150,
      });
    });

    // @gate www || experimental
    it('should return a multiple rects for single match that returns a fragment', () => {
      const refA = React.createRef();
      const refB = React.createRef();

      function Example() {
        return (
          <>
            <div ref={refA}>
              <div />
              <div />
            </div>
            <div ref={refB} />
          </>
        );
      }

      render(<Example />, container);

      setBoundingClientRect(refA.current, {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
      setBoundingClientRect(refB.current, {
        x: 110,
        y: 120,
        width: 250,
        height: 150,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Example),
      ]);
      expect(rects).toHaveLength(2);
      expect(rects).toContainEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
      expect(rects).toContainEqual({
        x: 110,
        y: 120,
        width: 250,
        height: 150,
      });
    });

    // @gate www || experimental
    it('should merge overlapping rects', () => {
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();

      function Example() {
        return (
          <>
            <div ref={refA} />
            <div ref={refB} />
            <div ref={refC} />
          </>
        );
      }

      render(<Example />, container);

      setBoundingClientRect(refA.current, {
        x: 10,
        y: 10,
        width: 50,
        height: 25,
      });
      setBoundingClientRect(refB.current, {
        x: 10,
        y: 10,
        width: 20,
        height: 10,
      });
      setBoundingClientRect(refC.current, {
        x: 100,
        y: 10,
        width: 50,
        height: 25,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Example),
      ]);
      expect(rects).toHaveLength(2);
      expect(rects).toContainEqual({
        x: 10,
        y: 10,
        width: 50,
        height: 25,
      });
      expect(rects).toContainEqual({
        x: 100,
        y: 10,
        width: 50,
        height: 25,
      });
    });

    // @gate www || experimental
    it('should merge some types of adjacent rects (if they are the same in one dimension)', () => {
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();
      const refD = React.createRef();
      const refE = React.createRef();
      const refF = React.createRef();
      const refG = React.createRef();

      function Example() {
        return (
          <>
            <div ref={refA} data-debug="A" />
            <div ref={refB} data-debug="B" />
            <div ref={refC} data-debug="C" />
            <div ref={refD} data-debug="D" />
            <div ref={refE} data-debug="E" />
            <div ref={refF} data-debug="F" />
            <div ref={refG} data-debug="G" />
          </>
        );
      }

      render(<Example />, container);

      // A, B, and C are all adjacent and/or overlapping, with the same height.
      setBoundingClientRect(refA.current, {
        x: 30,
        y: 0,
        width: 40,
        height: 25,
      });
      setBoundingClientRect(refB.current, {
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
      setBoundingClientRect(refC.current, {
        x: 70,
        y: 0,
        width: 20,
        height: 25,
      });

      // D is partially overlapping with A and B, but is too tall to be merged.
      setBoundingClientRect(refD.current, {
        x: 20,
        y: 0,
        width: 20,
        height: 30,
      });

      // Same thing but for a vertical group.
      // Some of them could intersect with the horizontal group,
      // except they're too far to the right.
      setBoundingClientRect(refE.current, {
        x: 100,
        y: 25,
        width: 25,
        height: 50,
      });
      setBoundingClientRect(refF.current, {
        x: 100,
        y: 0,
        width: 25,
        height: 25,
      });
      setBoundingClientRect(refG.current, {
        x: 100,
        y: 75,
        width: 25,
        height: 10,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Example),
      ]);
      expect(rects).toHaveLength(3);
      expect(rects).toContainEqual({
        x: 0,
        y: 0,
        width: 90,
        height: 25,
      });
      expect(rects).toContainEqual({
        x: 20,
        y: 0,
        width: 20,
        height: 30,
      });
      expect(rects).toContainEqual({
        x: 100,
        y: 0,
        width: 25,
        height: 85,
      });
    });

    // @gate www || experimental
    it('should not search within hidden subtrees', () => {
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();

      function Example() {
        return (
          <>
            <div ref={refA} />
            <div hidden={true} ref={refB} />
            <div ref={refC} />
          </>
        );
      }

      render(<Example />, container);

      setBoundingClientRect(refA.current, {
        x: 10,
        y: 10,
        width: 50,
        height: 25,
      });
      setBoundingClientRect(refB.current, {
        x: 100,
        y: 10,
        width: 20,
        height: 10,
      });
      setBoundingClientRect(refC.current, {
        x: 200,
        y: 10,
        width: 50,
        height: 25,
      });

      const rects = findBoundingRects(document.body, [
        createComponentSelector(Example),
      ]);
      expect(rects).toHaveLength(2);
      expect(rects).toContainEqual({
        x: 10,
        y: 10,
        width: 50,
        height: 25,
      });
      expect(rects).toContainEqual({
        x: 200,
        y: 10,
        width: 50,
        height: 25,
      });
    });
  });

  describe('focusWithin', () => {
    // @gate www || experimental
    it('should return false if the specified component path has no matches', () => {
      function Example() {
        return <Child />;
      }
      function Child() {
        return null;
      }
      function NotUsed() {
        return null;
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
        createComponentSelector(NotUsed),
      ]);
      expect(didFocus).toBe(false);
    });

    // @gate www || experimental
    it('should return false if there are no focusable elements within the matched subtree', () => {
      function Example() {
        return <Child />;
      }
      function Child() {
        return 'not focusable';
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
        createComponentSelector(Child),
      ]);
      expect(didFocus).toBe(false);
    });

    // @gate www || experimental
    it('should return false if the only focusable elements are disabled', () => {
      function Example() {
        return (
          <button disabled={true} style={{width: 10, height: 10}}>
            not clickable
          </button>
        );
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
      ]);
      expect(didFocus).toBe(false);
    });

    // @gate www || experimental
    it('should return false if the only focusable elements are hidden', () => {
      function Example() {
        return <button hidden={true}>not clickable</button>;
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
      ]);
      expect(didFocus).toBe(false);
    });

    // @gate www || experimental
    it('should successfully focus the first focusable element within the tree', () => {
      const secondRef = React.createRef(null);

      const handleFirstFocus = jest.fn();
      const handleSecondFocus = jest.fn();
      const handleThirdFocus = jest.fn();

      function Example() {
        return (
          <>
            <FirstChild />
            <SecondChild />
            <ThirdChild />
          </>
        );
      }
      function FirstChild() {
        return (
          <button hidden={true} onFocus={handleFirstFocus}>
            not clickable
          </button>
        );
      }
      function SecondChild() {
        return (
          <button
            ref={secondRef}
            style={{width: 10, height: 10}}
            onFocus={handleSecondFocus}>
            clickable
          </button>
        );
      }
      function ThirdChild() {
        return (
          <button style={{width: 10, height: 10}} onFocus={handleThirdFocus}>
            clickable
          </button>
        );
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
      ]);
      expect(didFocus).toBe(true);
      expect(document.activeElement).not.toBeNull();
      expect(document.activeElement).toBe(secondRef.current);
      expect(handleFirstFocus).not.toHaveBeenCalled();
      expect(handleSecondFocus).toHaveBeenCalledTimes(1);
      expect(handleThirdFocus).not.toHaveBeenCalled();
    });

    // @gate www || experimental
    it('should successfully focus the first focusable element even if application logic interferes', () => {
      const ref = React.createRef(null);

      const handleFocus = jest.fn(event => {
        event.target.blur();
      });

      function Example() {
        return (
          <button
            ref={ref}
            style={{width: 10, height: 10}}
            onFocus={handleFocus}>
            clickable
          </button>
        );
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
      ]);
      expect(didFocus).toBe(true);
      expect(ref.current).not.toBeNull();
      expect(ref.current).not.toBe(document.activeElement);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    // @gate www || experimental
    it('should not focus within hidden subtrees', () => {
      const secondRef = React.createRef(null);

      const handleFirstFocus = jest.fn();
      const handleSecondFocus = jest.fn();
      const handleThirdFocus = jest.fn();

      function Example() {
        return (
          <>
            <FirstChild />
            <SecondChild />
            <ThirdChild />
          </>
        );
      }
      function FirstChild() {
        return (
          <div hidden={true}>
            <button style={{width: 10, height: 10}} onFocus={handleFirstFocus}>
              hidden
            </button>
          </div>
        );
      }
      function SecondChild() {
        return (
          <button
            ref={secondRef}
            style={{width: 10, height: 10}}
            onFocus={handleSecondFocus}>
            clickable
          </button>
        );
      }
      function ThirdChild() {
        return (
          <button style={{width: 10, height: 10}} onFocus={handleThirdFocus}>
            clickable
          </button>
        );
      }

      render(<Example />, container);

      const didFocus = focusWithin(document.body, [
        createComponentSelector(Example),
      ]);
      expect(didFocus).toBe(true);
      expect(document.activeElement).not.toBeNull();
      expect(document.activeElement).toBe(secondRef.current);
      expect(handleFirstFocus).not.toHaveBeenCalled();
      expect(handleSecondFocus).toHaveBeenCalledTimes(1);
      expect(handleThirdFocus).not.toHaveBeenCalled();
    });
  });

  describe('observeVisibleRects', () => {
    // Stub out getBoundingClientRect for the specified target.
    // This API is required by the test selectors but it isn't implemented by jsdom.
    function setBoundingClientRect(target, {x, y, width, height}) {
      target.getBoundingClientRect = function () {
        return {
          width,
          height,
          left: x,
          right: x + width,
          top: y,
          bottom: y + height,
        };
      };
    }

    function simulateIntersection(...entries) {
      callback(
        entries.map(([target, rect, ratio]) => ({
          boundingClientRect: {
            top: rect.y,
            left: rect.x,
            width: rect.width,
            height: rect.height,
          },
          intersectionRatio: ratio,
          target,
        })),
      );
    }

    let callback;
    let observedTargets;

    beforeEach(() => {
      callback = null;
      observedTargets = [];

      class IntersectionObserver {
        constructor() {
          callback = arguments[0];
        }

        disconnect() {
          callback = null;
          observedTargets.splice(0);
        }

        observe(target) {
          observedTargets.push(target);
        }

        unobserve(target) {
          const index = observedTargets.indexOf(target);
          if (index >= 0) {
            observedTargets.splice(index, 1);
          }
        }
      }

      // This is a broken polyfill.
      // It is only intended to provide bare minimum test coverage.
      // More meaningful tests will require the use of fixtures.
      window.IntersectionObserver = IntersectionObserver;
    });

    // @gate www || experimental
    it('should notify a listener when the underlying instance intersection changes', () => {
      const ref = React.createRef(null);

      function Example() {
        return <div ref={ref} />;
      }

      render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref.current, rect);

      const handleVisibilityChange = jest.fn();
      observeVisibleRects(
        document.body,
        [createComponentSelector(Example)],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(1);
      expect(handleVisibilityChange).not.toHaveBeenCalled();

      // Simulate IntersectionObserver notification.
      simulateIntersection([ref.current, rect, 0.5]);

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([{rect, ratio: 0.5}]);
    });

    // @gate www || experimental
    it('should notify a listener of multiple targets when the underlying instance intersection changes', () => {
      const ref1 = React.createRef(null);
      const ref2 = React.createRef(null);

      function Example() {
        return (
          <>
            <div ref={ref1} />
            <div ref={ref2} />
          </>
        );
      }

      render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect1 = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      let rect2 = {
        x: 210,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref1.current, rect1);
      setBoundingClientRect(ref2.current, rect2);

      const handleVisibilityChange = jest.fn();
      observeVisibleRects(
        document.body,
        [createComponentSelector(Example)],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(2);
      expect(handleVisibilityChange).not.toHaveBeenCalled();

      // Simulate IntersectionObserver notification.
      simulateIntersection([ref1.current, rect1, 0.5]);

      // Even though only one of the rects changed intersection,
      // the test selector should describe the current state of both.
      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 0.5},
        {rect: rect2, ratio: 0},
      ]);

      handleVisibilityChange.mockClear();

      rect2 = {
        x: 210,
        y: 20,
        width: 200,
        height: 200,
      };

      // Simulate another IntersectionObserver notification.
      simulateIntersection(
        [ref1.current, rect1, 1],
        [ref2.current, rect2, 0.25],
      );

      // The newly changed display rect should also be provided for the second target.
      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 1},
        {rect: rect2, ratio: 0.25},
      ]);
    });

    // @gate www || experimental
    it('should stop listening when its disconnected', () => {
      const ref = React.createRef(null);

      function Example() {
        return <div ref={ref} />;
      }

      render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref.current, rect);

      const handleVisibilityChange = jest.fn();
      const {disconnect} = observeVisibleRects(
        document.body,
        [createComponentSelector(Example)],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(1);
      expect(handleVisibilityChange).not.toHaveBeenCalled();

      disconnect();
      expect(callback).toBeNull();
    });

    // This test reuires gating because it relies on the __DEV__ only commit hook to work.
    // @gate www || experimental && __DEV__
    it('should update which targets its listening to after a commit', () => {
      const ref1 = React.createRef(null);
      const ref2 = React.createRef(null);

      let increment;

      function Example() {
        const [count, setCount] = React.useState(0);
        increment = () => setCount(count + 1);
        return (
          <>
            {count < 2 && <div ref={ref1} />}
            {count > 0 && <div ref={ref2} />}
          </>
        );
      }

      render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect1 = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref1.current, rect1);

      const handleVisibilityChange = jest.fn();
      observeVisibleRects(
        document.body,
        [createComponentSelector(Example)],
        handleVisibilityChange,
      );

      // Simulate IntersectionObserver notification.
      simulateIntersection([ref1.current, rect1, 1]);

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 1},
      ]);

      act(() => increment());

      const rect2 = {
        x: 110,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref2.current, rect2);

      handleVisibilityChange.mockClear();

      simulateIntersection(
        [ref1.current, rect1, 0.5],
        [ref2.current, rect2, 0.25],
      );

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 0.5},
        {rect: rect2, ratio: 0.25},
      ]);

      act(() => increment());

      handleVisibilityChange.mockClear();

      simulateIntersection([ref2.current, rect2, 0.75]);

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect2, ratio: 0.75},
      ]);
    });

    // @gate www || experimental
    it('should not observe components within hidden subtrees', () => {
      const ref1 = React.createRef(null);
      const ref2 = React.createRef(null);

      function Example() {
        return (
          <>
            <div ref={ref1} />
            <div hidden={true} ref={ref2} />
          </>
        );
      }

      render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect1 = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      const rect2 = {
        x: 210,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref1.current, rect1);
      setBoundingClientRect(ref2.current, rect2);

      const handleVisibilityChange = jest.fn();
      observeVisibleRects(
        document.body,
        [createComponentSelector(Example)],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(1);
      expect(observedTargets[0]).toBe(ref1.current);
    });
  });
});
