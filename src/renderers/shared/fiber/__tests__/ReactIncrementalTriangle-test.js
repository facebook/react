/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;
var ReactFeatureFlags;

describe('ReactConcurrency', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('ReactNoop');

    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function TriangleTester() {
    let triangles = [];
    let leafTriangles = [];
    let yieldAfterEachRender = false;
    let lastRenderedTriangle = null;
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
        lastRenderedTriangle = this;
        if (yieldAfterEachRender) {
          ReactNoop.yieldBeforeNextUnitOfWork();
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

    let app;
    class App extends React.Component {
      state = {counter: 0};
      interrupt() {
        // Triggers a restart from the top.
        ReactNoop.performAnimationWork(() => {
          this.setState({});
        });
      }
      setCounter(counter) {
        const currentCounter = this.state.counter;
        this.setState({counter});
        return currentCounter;
      }
      render() {
        app = this;
        return <Triangle counter={this.state.counter} depth={3} />;
      }
    }

    const depth = 3;
    ReactNoop.render(<App depth={depth} />);
    ReactNoop.flush();
    // Check initial mount
    treeIsConsistent(0);

    function treeIsConsistent(counter, activeTriangles = new Set()) {
      let activeIndices = [];
      activeTriangles.forEach(activeTriangle => {
        activeIndices.push(activeTriangle.leafIndex);
      });

      const children = ReactNoop.getChildren();
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let num = child.prop;

        if (activeIndices.indexOf(i) > -1) {
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

    function renderNextTriangle() {
      yieldAfterEachRender = true;
      lastRenderedTriangle = null;
      ReactNoop.flush();
      yieldAfterEachRender = false;
      return lastRenderedTriangle;
    }

    function step(nextCounter, ...configs) {
      const currentCounter = app.setCounter(nextCounter);

      const onKeyframes = new Map();
      const offKeyframes = new Map();

      for (const [targetIndex, onKeyframe, offKeyframe] of configs) {
        const targetTriangle = leafTriangles[targetIndex];
        if (targetTriangle == null) {
          throw new Error('targetIndex should be the index of a leaf triangle');
        }

        const onTriangles = onKeyframes.get(targetIndex) || new Set();
        onTriangles.add(targetTriangle);
        onKeyframes.set(onKeyframe, onTriangles);

        const offTriangles = offKeyframes.get(targetIndex) || new Set();
        offTriangles.add(targetTriangle);
        offKeyframes.set(offKeyframe, offTriangles);
      }

      const activeTriangles = new Set();

      let i = 0;
      let renderedTriangle = renderNextTriangle();
      while (renderedTriangle !== null) {
        if (i++ > 999) {
          throw new Error('Infinite loop');
        }
        treeIsConsistent(currentCounter, activeTriangles);

        var onTriangles = onKeyframes.get(renderedTriangle.index);
        if (onTriangles) {
          onTriangles.forEach(targetTriangle => {
            ReactNoop.performAnimationWork(() => {
              targetTriangle.activate();
            });
            activeTriangles.add(targetTriangle);
            onTriangles.delete(targetTriangle);
          });
        }

        var offTriangles = offKeyframes.get(renderedTriangle.index);
        if (offTriangles) {
          offTriangles.forEach(targetTriangle => {
            ReactNoop.performAnimationWork(() => {
              targetTriangle.deactivate();
            });
            activeTriangles.delete(targetTriangle);
            offTriangles.delete(targetTriangle);
          });
        }

        app.interrupt();
        ReactNoop.flushAnimationPri();
        treeIsConsistent(currentCounter, activeTriangles);

        renderedTriangle = renderNextTriangle();
      }

      treeIsConsistent(nextCounter, activeTriangles);
    }

    return {step};
  }

  it('works', () => {
    const {step} = TriangleTester();

    // Render the whole tree, without toggling any nodes. After each triangle,
    // the unit of work pointer is reset to the root, to simulate being
    // interrupted by the container's animation.
    step(1);

    // Now let's simulate the hover effect. Same as last time, but when were
    // partially done rendering, we'll schedule a hi-pri update to "activate"
    // a target leaf node. Then we'll render a bit more, and scheduling another
    // hi-pri update to "deactivate" that same node.
    step(2, [5, 5, 10]);
    step(3, [22, 20, 22]);
    step(4, [13, 10, 30]);
    step(5, [7, 35, 38]);
    step(6, [17, 8, 14]);

    // Simulate multiple hover effects in the same step.
    step(7, [3, 4, 21], [17, 8, 14], [19, 7, 12]);
    step(8, [3, 4, 39], [17, 8, 14], [19, 7, 12]);
  });
});
