/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;

describe('ReactIncrementalTriangle', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  const FLUSH = 'FLUSH';
  function flush(unitsOfWork = Infinity) {
    return {
      type: FLUSH,
      unitsOfWork,
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
    switch (randomInteger(0, 5)) {
      case 0:
        return flush(randomInteger(0, TOTAL_TRIANGLES * 1.5));
      case 1:
        return step(randomInteger(0, 10));
      case 2:
        return interrupt();
      case 3:
        return toggle(randomInteger(0, TOTAL_CHILDREN));
      case 4:
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
    let triangles = [];
    let leafTriangles = [];
    let yieldAfterEachRender = false;
    class Triangle extends React.Component {
      constructor(props) {
        super();
        this.index = triangles.length;
        triangles.push(this);
        if (props.depth === 0) {
          this.leafIndex = leafTriangles.length;
          leafTriangles.push(this);
        }
        this.state = {isActive: false};
      }
      activate() {
        if (this.props.depth !== 0) {
          throw new Error('Cannot activate non-leaf component');
        }
        this.setState({isActive: true});
      }
      deactivate() {
        if (this.props.depth !== 0) {
          throw new Error('Cannot deactivate non-leaf component');
        }
        this.setState({isActive: false});
      }
      shouldComponentUpdate(nextProps, nextState) {
        return (
          this.props.counter !== nextProps.counter ||
          this.state.isActive !== nextState.isActive
        );
      }
      render() {
        if (yieldAfterEachRender) {
          ReactNoop.yield(this);
        }
        const {counter, depth} = this.props;
        if (depth === 0) {
          if (this.state.isActive) {
            return <span prop={'*' + counter + '*'} />;
          }
          return <span prop={counter} />;
        }
        return [
          <Triangle key={1} counter={counter} depth={depth - 1} />,
          <Triangle key={2} counter={counter} depth={depth - 1} />,
          <Triangle key={3} counter={counter} depth={depth - 1} />,
        ];
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
        return <Triangle counter={this.state.counter} depth={3} />;
      }
    }

    let keyCounter = 0;
    function reset(nextStep = 0) {
      triangles = [];
      leafTriangles = [];
      // Remounts the whole tree by changing the key
      if (rootID) {
        ReactNoop.renderToRootWithID(
          <App depth={MAX_DEPTH} key={keyCounter++} />,
          rootID,
        );
      } else {
        ReactNoop.render(<App depth={MAX_DEPTH} key={keyCounter++} />);
      }
      ReactNoop.flush();
      assertConsistentTree();
      return appInstance;
    }

    reset();

    function assertConsistentTree(activeTriangle, counter) {
      const activeIndex = activeTriangle ? activeTriangle.leafIndex : -1;

      const children = ReactNoop.getChildren(rootID);

      if (children.length !== TOTAL_CHILDREN) {
        throw new Error('Wrong number of children.');
      }

      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let num = child.prop;

        // If an expected counter is not specified, use the value of the
        // first child.
        if (counter === undefined) {
          if (typeof num === 'string') {
            counter = parseInt(num.substr(1, num.length - 2), 10);
          } else {
            counter = num;
          }
        }

        if (i === activeIndex) {
          if (num !== `*${counter}*`) {
            throw new Error(
              `Triangle ${i} is inconsistent: ${num} instead of *${counter}*.`,
            );
          }
        } else {
          if (num !== counter) {
            throw new Error(
              `Triangle ${i} is inconsistent: ${num} instead of ${counter}.`,
            );
          }
        }
      }
    }

    function* simulateAndYield() {
      const app = reset();
      let expectedCounterAtEnd = app.state.counter;

      let activeTriangle = null;
      while (true) {
        var action = yield;
        if (action === STOP) {
          break;
        }
        ReactNoop.flushSync(() => {
          switch (action.type) {
            case FLUSH:
              ReactNoop.flushUnitsOfWork(action.unitsOfWork);
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
              const targetTriangle = leafTriangles[action.childIndex];
              if (targetTriangle === undefined) {
                throw new Error('Target index is out of bounds');
              }
              if (targetTriangle === activeTriangle) {
                activeTriangle = null;
                targetTriangle.deactivate();
              } else {
                if (activeTriangle !== null) {
                  activeTriangle.deactivate();
                }
                activeTriangle = targetTriangle;
                targetTriangle.activate();
              }
              break;
            case EXPIRE:
              ReactNoop.expire(action.ms);
              break;
            default:
              break;
          }
        });
        assertConsistentTree(activeTriangle);
      }
      // Flush remaining work
      ReactNoop.flush();
      assertConsistentTree(activeTriangle, expectedCounterAtEnd);
    }

    function simulate(...actions) {
      const gen = simulateAndYield();
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
