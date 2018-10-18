/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;

describe('ReactIncrementalTriangle', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  const FLUSH = 'FLUSH';
  function flush(unitsOfWork = Infinity) {
    return {
      type: FLUSH,
      unitsOfWork,
    };
  }

  const FLUSH_ALL = 'FLUSH_ALL';
  function flushAll() {
    return {
      type: FLUSH_ALL,
    };
  }

  const STEP = 'STEP';
  function step(counter) {
    return {
      type: STEP,
      counter,
    };
  }

  const INTERRUPT = 'INTERRUPT';
  function interrupt(key) {
    return {
      type: INTERRUPT,
    };
  }

  const TOGGLE = 'TOGGLE';
  function toggle(childIndex) {
    return {
      type: TOGGLE,
      childIndex,
    };
  }

  const EXPIRE = 'EXPIRE';
  function expire(ms) {
    return {
      type: EXPIRE,
      ms,
    };
  }

  const STOP = 'STOP';

  function randomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function formatAction(action) {
    switch (action.type) {
      case FLUSH:
        return `flush(${action.unitsOfWork})`;
      case FLUSH_ALL:
        return 'flushAll()';
      case STEP:
        return `step(${action.counter})`;
      case INTERRUPT:
        return 'interrupt()';
      case TOGGLE:
        return `toggle(${action.childIndex})`;
      case EXPIRE:
        return `expire(${action.ms})`;
      default:
        throw new Error('Switch statement should be exhaustive');
    }
  }

  function formatActions(actions) {
    let result = 'simulate(';
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      result += formatAction(action);
      if (i !== actions.length - 1) {
        result += ', ';
      }
    }
    result += ')';
    return result;
  }

  const MAX_DEPTH = 3;
  const TOTAL_CHILDREN = Math.pow(3, MAX_DEPTH);
  let TOTAL_TRIANGLES = 0;
  for (let i = 0; i <= MAX_DEPTH; i++) {
    TOTAL_TRIANGLES += Math.pow(3, i);
  }

  function randomAction() {
    const weights = [
      [FLUSH, 1],
      [FLUSH_ALL, 1],
      [STEP, 1],
      [INTERRUPT, 1],
      [TOGGLE, 1],
      [EXPIRE, 1],
    ];
    let totalWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      totalWeight += weights[i][1];
    }

    const randomNumber = Math.random() * totalWeight;
    let actionType;
    let remainingWeight = randomNumber;
    for (let i = 0; i < weights.length; i++) {
      const [option, weight] = weights[i];
      remainingWeight -= weight;
      if (remainingWeight <= 0) {
        actionType = option;
        break;
      }
    }

    switch (actionType) {
      case FLUSH:
        return flush(randomInteger(0, TOTAL_TRIANGLES * 1.5));
      case FLUSH_ALL:
        return flushAll();
      case STEP:
        return step(randomInteger(0, 10));
      case INTERRUPT:
        return interrupt();
      case TOGGLE:
        return toggle(randomInteger(0, TOTAL_TRIANGLES));
      case EXPIRE:
        return expire(randomInteger(0, 1500));
      default:
        throw new Error('Switch statement should be exhaustive');
    }
  }

  function randomActions(n) {
    let actions = [];
    for (let i = 0; i < n; i++) {
      actions.push(randomAction());
    }
    return actions;
  }

  function TriangleSimulator(rootID) {
    const CounterContext = React.createContext([]);
    const ActiveContext = React.createContext(0);

    let triangles = [];
    let leafTriangles = [];
    let yieldAfterEachRender = false;
    class Triangle extends React.Component {
      constructor(props) {
        super();
        this.index = triangles.length;
        triangles.push(this);
        if (props.remainingDepth === 0) {
          this.leafIndex = leafTriangles.length;
          leafTriangles.push(this);
        }
        this.state = {isActive: false};
      }
      activate() {
        this.setState({isActive: true});
      }
      deactivate() {
        this.setState({isActive: false});
      }
      shouldComponentUpdate(nextProps, nextState) {
        return (
          this.props.counter !== nextProps.counter ||
          this.props.activeDepth !== nextProps.activeDepth ||
          this.state.isActive !== nextState.isActive
        );
      }
      render() {
        if (yieldAfterEachRender) {
          ReactNoop.yield(this);
        }
        const {counter, remainingDepth} = this.props;
        return (
          <ActiveContext.Consumer>
            {activeContext => (
              <CounterContext.Consumer>
                {counterContext => {
                  const activeDepthProp = this.state.isActive
                    ? this.props.activeDepth + 1
                    : this.props.activeDepth;
                  const activeDepthContext = this.state.isActive
                    ? activeContext + 1
                    : activeContext;
                  if (remainingDepth === 0) {
                    // Leaf
                    const output = JSON.stringify({
                      prop: counter,
                      isActive: this.state.isActive,
                      counterContext: counterContext,
                      activeDepthProp,
                      activeDepthContext,
                    });
                    return <span prop={output} />;
                  }

                  return (
                    <ActiveContext.Provider value={activeDepthContext}>
                      <CounterContext.Provider value={counter}>
                        <Triangle
                          counter={counter}
                          activeDepth={activeDepthProp}
                          remainingDepth={remainingDepth - 1}
                        />
                        <Triangle
                          counter={counter}
                          activeDepth={activeDepthProp}
                          remainingDepth={remainingDepth - 1}
                        />
                        <Triangle
                          counter={counter}
                          activeDepth={activeDepthProp}
                          remainingDepth={remainingDepth - 1}
                        />
                      </CounterContext.Provider>
                    </ActiveContext.Provider>
                  );
                }}
              </CounterContext.Consumer>
            )}
          </ActiveContext.Consumer>
        );
      }
    }

    let appInstance;
    class App extends React.Component {
      state = {counter: 0};
      interrupt() {
        // Triggers a restart from the top.
        this.forceUpdate();
      }
      setCounter(counter) {
        const currentCounter = this.state.counter;
        this.setState({counter});
        return currentCounter;
      }
      render() {
        appInstance = this;
        return (
          <Triangle
            counter={this.state.counter}
            activeDepth={0}
            remainingDepth={this.props.remainingDepth}
          />
        );
      }
    }

    let keyCounter = 0;
    function reset(nextStep = 0) {
      triangles = [];
      leafTriangles = [];
      // Remounts the whole tree by changing the key
      if (rootID) {
        ReactNoop.renderToRootWithID(
          <App remainingDepth={MAX_DEPTH} key={keyCounter++} />,
          rootID,
        );
      } else {
        ReactNoop.render(<App remainingDepth={MAX_DEPTH} key={keyCounter++} />);
      }
      ReactNoop.flush();
      assertConsistentTree();
      return appInstance;
    }

    reset();

    function assertConsistentTree(activeTriangleIndices = new Set(), counter) {
      const children = ReactNoop.getChildren(rootID);

      if (children.length !== TOTAL_CHILDREN) {
        throw new Error('Wrong number of children.');
      }

      let expectedCounter = counter;

      for (let i = 0; i < children.length; i++) {
        let child = children[i];

        const output = JSON.parse(child.prop);
        const prop = output.prop;
        const isActive = output.isActive;
        const counterContext = output.counterContext;
        const activeDepthProp = output.activeDepthProp;
        const activeDepthContext = output.activeDepthContext;

        // If an expected counter is not specified, use the value of the
        // first child.
        if (expectedCounter === undefined) {
          expectedCounter = prop;
        }
        const expectedIsActive = activeTriangleIndices.has(i);

        if (prop !== expectedCounter) {
          throw new Error(
            `Triangle ${i} is inconsistent: prop ${prop} instead of ` +
              expectedCounter,
          );
        }

        if (isActive !== expectedIsActive) {
          throw new Error(
            `Triangle ${i} is inconsistent: isActive ${isActive} instead of ` +
              expectedIsActive,
          );
        }

        if (counterContext !== prop) {
          throw new Error(
            `Triangle ${i} is inconsistent: prop ${prop} does not match ` +
              `counterContext ${counterContext}`,
          );
        }

        if (activeDepthContext !== activeDepthProp) {
          throw new Error(
            `Triangle ${i} is inconsistent: activeDepthProp ` +
              `${activeDepthProp} does not match activeDepthContext ` +
              activeDepthContext,
          );
        }
      }
    }

    function* simulateAndYield() {
      const app = reset();
      let expectedCounterAtEnd = app.state.counter;

      let activeIndices = new Set();
      let activeLeafIndices = new Set();
      let action;
      while (true) {
        action = yield;
        if (action === STOP) {
          break;
        }
        ReactNoop.flushSync(() => {
          switch (action.type) {
            case FLUSH:
              ReactNoop.flushUnitsOfWork(action.unitsOfWork);
              break;
            case FLUSH_ALL:
              ReactNoop.flush();
              break;
            case STEP:
              ReactNoop.deferredUpdates(() => {
                app.setCounter(action.counter);
                expectedCounterAtEnd = action.counter;
              });
              break;
            case INTERRUPT:
              app.interrupt();
              break;
            case TOGGLE:
              const targetTriangle = triangles[action.childIndex];
              if (targetTriangle === undefined) {
                throw new Error('Target index is out of bounds');
              }
              const index = targetTriangle.index;
              const leafIndex = targetTriangle.leafIndex;
              if (activeIndices.has(index)) {
                activeIndices.delete(index);
                if (leafIndex !== undefined) {
                  activeLeafIndices.delete(leafIndex);
                }
                targetTriangle.deactivate();
              } else {
                activeIndices.add(index);
                if (leafIndex !== undefined) {
                  activeLeafIndices.add(leafIndex);
                }
                targetTriangle.activate();
              }
              break;
            case EXPIRE:
              ReactNoop.expire(action.ms);
              break;
            default:
              throw new Error('Switch statement should be exhaustive');
          }
        });
        assertConsistentTree(activeLeafIndices);
      }
      // Flush remaining work
      ReactNoop.flush();
      assertConsistentTree(activeLeafIndices, expectedCounterAtEnd);
    }

    function simulate(...actions) {
      const gen = simulateAndYield();
      // Call this once to prepare the generator
      gen.next();
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (let action of actions) {
        gen.next(action);
      }
      gen.next(STOP);
    }

    return {
      simulateAndYield,
      simulate,
      randomAction,
      randomActions,
    };
  }

  describe('single root', () => {
    // These tests are not deterministic because the inputs are randomized. It
    // runs a limited number of tests on every run. If it fails, it will output
    // the case that led to the failure. Add the failing case to the test above
    // to prevent future regressions.
    it('hard-coded tests', () => {
      const {simulate} = TriangleSimulator();
      simulate(step(1));
      simulate(toggle(0), step(1), toggle(0));
      simulate(step(1), toggle(0), flush(2), step(2), toggle(0));
      simulate(step(1), flush(3), toggle(0), step(0));
      simulate(step(1), flush(3), toggle(18), step(0));
      simulate(step(4), flush(52), expire(1476), flush(17), step(0));
      simulate(interrupt(), toggle(10), step(2), expire(990), flush(46));
      simulate(interrupt(), step(6), step(7), toggle(6), interrupt());
      simulate(interrupt(), toggle(31), toggle(31), toggle(13), step(1));
    });

    it('generative tests', () => {
      const {simulate} = TriangleSimulator();

      const limit = 1000;

      for (let i = 0; i < limit; i++) {
        const actions = randomActions(5);
        try {
          simulate(...actions);
        } catch (e) {
          console.error(
            `Triangle fuzz tester error! Copy and paste the following line into the test suite:
${formatActions(actions)}
          `,
          );
          throw e;
        }
      }
    });
  });

  describe('multiple roots', () => {
    const rootIDs = ['a', 'b', 'c'];

    function randomActionsPerRoot() {
      function randomRootID() {
        const index = randomInteger(0, rootIDs.length);
        return rootIDs[index];
      }

      const actions = [];
      for (let i = 0; i < 10; i++) {
        const rootID = randomRootID();
        const action = randomAction();
        actions.push([rootID, action]);
      }
      return actions;
    }

    function formatActionsPerRoot(actions) {
      let result = 'simulateMultipleRoots(';
      for (let i = 0; i < actions.length; i++) {
        const [rootID, action] = actions[i];
        result += `['${rootID}', ${formatAction(action)}]`;
        if (i !== actions.length - 1) {
          result += ', ';
        }
      }
      result += ')';
      return result;
    }

    function simulateMultipleRoots(...actions) {
      const roots = new Map();
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (let rootID of rootIDs) {
        const simulator = TriangleSimulator(rootID);
        const generator = simulator.simulateAndYield();
        // Call this once to prepare the generator
        generator.next();
        roots.set(rootID, generator);
      }

      actions.forEach(([rootID, action]) => {
        const generator = roots.get(rootID);
        generator.next(action);
      });
      roots.forEach(generator => {
        generator.next(STOP);
      });
    }

    it('hard-coded tests', () => {
      simulateMultipleRoots(
        ['b', interrupt()],
        ['a', toggle(22)],
        ['c', step(4)],
        ['a', expire(10)],
        ['a', interrupt()],
        ['c', step(2)],
        ['b', interrupt()],
      );

      simulateMultipleRoots(
        ['c', toggle(0)],
        ['c', step(1)],
        ['b', flush(7)],
        ['c', toggle(0)],
      );
    });

    it('generative tests', () => {
      const limit = 100;
      for (let i = 0; i < limit; i++) {
        const actions = randomActionsPerRoot();
        try {
          simulateMultipleRoots(...actions);
        } catch (e) {
          console.error(
            `Triangle fuzz tester error! Copy and paste the following line into the test suite:
${formatActionsPerRoot(actions)}
              `,
          );
          throw e;
        }
      }
    });
  });
});
