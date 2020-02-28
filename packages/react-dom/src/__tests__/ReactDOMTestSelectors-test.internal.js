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
let ReactDOM;

describe('ReactDOMTestSelectors', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom/testing');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('findAllNodes', () => {
    it('should support searching from the document root', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      ReactDOM.render(<Example />, container);

      const matches = ReactDOM.findAllNodes(document.body, [Example], 'match');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    it('should support searching from the container', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      ReactDOM.render(<Example />, container);

      const matches = ReactDOM.findAllNodes(container, [Example], 'match');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

    it('should support searching from a previous match', () => {
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

      ReactDOM.render(<Outer />, container);

      let matches = ReactDOM.findAllNodes(container, [Outer], 'outer');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('outer');

      matches = ReactDOM.findAllNodes(matches[0], [Inner], 'inner');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('inner');
    });

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

      ReactDOM.render(<Outer />, container);

      let matches = ReactDOM.findAllNodes(
        document.body,
        [Outer, Middle],
        'match',
      );
      expect(matches).toHaveLength(2);
      expect(matches.map(m => m.id).sort()).toEqual(['match2', 'match3']);

      matches = ReactDOM.findAllNodes(
        document.body,
        [Outer, Middle, Inner],
        'match',
      );
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match3');

      matches = ReactDOM.findAllNodes(document.body, [Outer, Inner], 'match');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match3');
    });

    it('should support an empty component type selector array', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      ReactDOM.render(<Example />, container);

      const matches = ReactDOM.findAllNodes(document.body, [], 'match');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('match');
    });

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

      ReactDOM.render(
        <>
          <Example1 />
          <Example2 />
        </>,
        container,
      );

      const matches = ReactDOM.findAllNodes(document.body, [], 'match');
      expect(matches).toHaveLength(3);
      expect(matches.map(m => m.id).sort()).toEqual([
        'match1',
        'match2',
        'match3',
      ]);
    });

    it('should find nested matches', () => {
      function Example() {
        return (
          <div data-testname="match" id="match1">
            <div data-testname="match" id="match2" />
          </div>
        );
      }

      ReactDOM.render(<Example />, container);

      const matches = ReactDOM.findAllNodes(document.body, [Example], 'match');
      expect(matches).toHaveLength(2);
      expect(matches.map(m => m.id).sort()).toEqual(['match1', 'match2']);
    });

    it('should enforce the specific order of components types', () => {
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

      ReactDOM.render(<Outer />, container);

      expect(
        ReactDOM.findAllNodes(document.body, [Inner, Outer], 'match'),
      ).toHaveLength(0);
    });

    it('should only search the subtree within the component types selector', () => {
      function Outer() {
        return (
          <>
            <div data-testname="match" id="match1" />
            <Inner />
          </>
        );
      }
      function Inner() {
        return <div />;
      }

      ReactDOM.render(<Outer />, container);

      expect(
        ReactDOM.findAllNodes(document.body, [Outer, Inner], 'match'),
      ).toHaveLength(0);

      expect(
        ReactDOM.findAllNodes(document.body, [Inner], 'match'),
      ).toHaveLength(0);
    });

    it('should not search within hidden subtrees', () => {
      const ref1 = React.createRef(null);
      const ref2 = React.createRef(null);

      function Outer() {
        return (
          <>
            <Inner />
            <div hidden={true}>
              <div ref={ref1} data-testname="match" />
            </div>
          </>
        );
      }
      function Inner() {
        return <div ref={ref2} data-testname="match" />;
      }

      ReactDOM.render(<Outer />, container);

      const matches = ReactDOM.findAllNodes(document.body, [Outer], 'match');

      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(ref2.current);
    });

    it('should throw if no container can be found', () => {
      expect(() => ReactDOM.findAllNodes(document.body, [], 'match')).toThrow(
        'Could not find React container within specified host subtree.',
      );
    });

    it('should throw if an invalid host root is specified', () => {
      const ref = React.createRef();
      function Example() {
        return <div ref={ref} />;
      }

      ReactDOM.render(<Example />, container);

      expect(() => ReactDOM.findAllNodes(ref.current, [], 'match')).toThrow(
        'Invalid host root specified. Should be either a React container or a node previously returned by findAllNodes().',
      );
    });
  });

  describe('getFindAllNodesFailureDescription', () => {
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

      ReactDOM.render(<Outer />, container);

      const description = ReactDOM.getFindAllNodesFailureDescription(
        document.body,
        [Outer, Middle, NotRendered],
        'match',
      );

      expect(description).toEqual(
        `findAllNodes was able to match part of the selector:
  Outer > Middle

No matching component was found for:
  NotRendered`,
      );
    });

    it('should describe findAllNodes failures caused by a failed test-name match', () => {
      function Example() {
        return (
          <>
            <Example1 />
            <Example2 />
          </>
        );
      }

      function Example1() {
        return (
          <div>
            <div data-testname="match1" />
          </div>
        );
      }

      function Example2() {
        return (
          <div>
            <div data-testname="match2" />
            <Example3 />
          </div>
        );
      }

      function Example3() {
        return (
          <>
            <div data-testname="match2" />
            <div data-testname="match3" />
          </>
        );
      }

      ReactDOM.render(<Example />, container);

      const description = ReactDOM.getFindAllNodesFailureDescription(
        document.body,
        [Example],
        'match',
      );

      expect(description).toEqual(
        `No host element was found with the test name "match".

The following test names were found in the matched subtree:
  match1
  match2
  match3`,
      );
    });

    it('should return null if findAllNodes was able to find a match', () => {
      function Example() {
        return (
          <div>
            <div data-testname="match" id="match" />
          </div>
        );
      }

      ReactDOM.render(<Example />, container);

      const description = ReactDOM.getFindAllNodesFailureDescription(
        document.body,
        [Example],
        'match',
      );

      expect(description).toBe(null);
    });
  });

  describe('findBoundingRects', () => {
    // Stub out getBoundingClientRect for the specified target.
    // This API is required by the test selectors but it isn't implemented by jsdom.
    function setBoundingClientRect(target, {x, y, width, height}) {
      target.getBoundingClientRect = function() {
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

      ReactDOM.render(<Example />, container);

      setBoundingClientRect(ref.current, {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });

      const rects = ReactDOM.findBoundingRects(document.body, [Example]);
      expect(rects).toHaveLength(1);
      expect(rects).toContainEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
    });

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

      ReactDOM.render(<Outer />, container);

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

      const rects = ReactDOM.findBoundingRects(document.body, [Outer]);
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

      ReactDOM.render(<Example />, container);

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

      const rects = ReactDOM.findBoundingRects(document.body, [Example]);
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

      ReactDOM.render(<Example />, container);

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

      const rects = ReactDOM.findBoundingRects(document.body, [Example]);
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

      ReactDOM.render(<Example />, container);

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

      const rects = ReactDOM.findBoundingRects(document.body, [Example]);
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
    beforeEach(() => {
      // JSdom does not do actual layout and so doesn't return meaningful values here.
      // For the purposes of our tests though, we need somewhat meaningful values here,
      // else the DOM host config will assume elements are not visible.
      Object.defineProperties(HTMLElement.prototype, {
        offsetWidth: {
          get: function() {
            return parseInt(this.style.width, 10) || 0;
          },
        },
        offsetHeight: {
          get: function() {
            return parseInt(this.style.height, 10) || 0;
          },
        },
      });
    });

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

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example, NotUsed]);
      expect(didFocus).toBe(false);
    });

    it('should return false if there are no focusable elements within the matched subtree', () => {
      function Example() {
        return <Child />;
      }
      function Child() {
        return 'not focusable';
      }

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example, Child]);
      expect(didFocus).toBe(false);
    });

    it('should return false if the only focusable elements are disabled', () => {
      function Example() {
        return (
          <button disabled={true} style={{width: 10, height: 10}}>
            not clickable
          </button>
        );
      }

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example]);
      expect(didFocus).toBe(false);
    });

    it('should return false if the only focusable elements are visible', () => {
      function Example() {
        return <button style={{display: 'none'}}>not clickable</button>;
      }

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example]);
      expect(didFocus).toBe(false);
    });

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
          <button style={{display: 'none'}} onFocus={handleFirstFocus}>
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

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example]);
      expect(didFocus).toBe(true);
      expect(document.activeElement).not.toBeNull();
      expect(document.activeElement).toBe(secondRef.current);
      expect(handleFirstFocus).not.toHaveBeenCalled();
      expect(handleSecondFocus).toHaveBeenCalledTimes(1);
      expect(handleThirdFocus).not.toHaveBeenCalled();
    });

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

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example]);
      expect(didFocus).toBe(true);
      expect(ref.current).not.toBeNull();
      expect(ref.current).not.toBe(document.activeElement);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

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

      ReactDOM.render(<Example />, container);

      const didFocus = ReactDOM.focusWithin(document.body, [Example]);
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
      target.getBoundingClientRect = function() {
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

    it('should notify a listener when the underlying instance intersection changes', () => {
      const ref = React.createRef(null);

      function Example() {
        return <div ref={ref} />;
      }

      ReactDOM.render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref.current, rect);

      const handleVisibilityChange = jest.fn();
      ReactDOM.observeVisibleRects(
        document.body,
        [Example],
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

      ReactDOM.render(<Example />, container);

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
      ReactDOM.observeVisibleRects(
        document.body,
        [Example],
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

      handleVisibilityChange.mockReset();

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

    it('should stop listening when its disconnected', () => {
      const ref = React.createRef(null);

      function Example() {
        return <div ref={ref} />;
      }

      ReactDOM.render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref.current, rect);

      const handleVisibilityChange = jest.fn();
      const {disconnect} = ReactDOM.observeVisibleRects(
        document.body,
        [Example],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(1);
      expect(handleVisibilityChange).not.toHaveBeenCalled();

      disconnect();
      expect(callback).toBeNull();
    });

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

      ReactDOM.render(<Example />, container);

      // Stub out the size of the element this test will be observing.
      const rect1 = {
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref1.current, rect1);

      const handleVisibilityChange = jest.fn();
      ReactDOM.observeVisibleRects(
        document.body,
        [Example],
        handleVisibilityChange,
      );

      // Simulate IntersectionObserver notification.
      simulateIntersection([ref1.current, rect1, 1]);

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 1},
      ]);

      ReactDOM.act(() => increment());

      const rect2 = {
        x: 110,
        y: 20,
        width: 200,
        height: 100,
      };
      setBoundingClientRect(ref2.current, rect2);

      handleVisibilityChange.mockReset();

      simulateIntersection(
        [ref1.current, rect1, 0.5],
        [ref2.current, rect2, 0.25],
      );

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect1, ratio: 0.5},
        {rect: rect2, ratio: 0.25},
      ]);

      ReactDOM.act(() => increment());

      handleVisibilityChange.mockReset();

      simulateIntersection([ref2.current, rect2, 0.75]);

      expect(handleVisibilityChange).toHaveBeenCalledTimes(1);
      expect(handleVisibilityChange).toHaveBeenCalledWith([
        {rect: rect2, ratio: 0.75},
      ]);
    });

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

      ReactDOM.render(<Example />, container);

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
      ReactDOM.observeVisibleRects(
        document.body,
        [Example],
        handleVisibilityChange,
      );

      expect(callback).not.toBeNull();
      expect(observedTargets).toHaveLength(1);
      expect(observedTargets[0]).toBe(ref1.current);
    });
  });
});
