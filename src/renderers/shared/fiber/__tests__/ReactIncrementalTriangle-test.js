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

  it('works', () => {
    let triangles = [];
    let leafTriangles = [];
    let didRenderTriangle = null;
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
        didRenderTriangle = this;
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

    global.debugLog = (...args) => {
      if (!global.debug) {
        return;
      }
      console.log(...args);
    };

    ReactNoop.render(<App depth={depth} />);
    ReactNoop.flush();
    didRenderTriangle = null;
    // Check initial mount
    treeIsConsistent(0);
    const totalTriangles = triangles.length;

    function treeIsConsistent(counter, ...activeIndices) {
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
      let i = 0;
      while (didRenderTriangle === null) {
        if (i++ > 100) {
          throw new Error('Inifinite loop');
        }
        ReactNoop.flushUnitsOfWork(1);
      }
      const triangle = didRenderTriangle;
      didRenderTriangle = null;
      return triangle;
    }

    function stepWithoutYielding(nextCounter) {
      // Increment the counter.
      const currentCounter = app.setCounter(nextCounter);

      // Flush the work incrementally, resetting the unit of work pointer after
      // each new triangle.
      const renderedTriangles = new Set();
      let i = 0;
      while (renderedTriangles.size < totalTriangles) {
        if (i++ > 100) {
          throw new Error('Infinite loop');
        }
        // Flush the work incrementally, resetting the unit of work pointer after
        // each new triangle.
        app.interrupt();

        // Flush until a new triangle is rendered
        const renderedTriangle = renderNextTriangle();
        treeIsConsistent(currentCounter);
        renderedTriangles.add(renderedTriangle);
      }

      // Should only take two more units of work to commit the tree: one to
      // complete the final span, and one to perform the commit. Otherwise,
      // work isn't bailing out like it should.
      ReactNoop.flushUnitsOfWork(2);
      treeIsConsistent(nextCounter);
    }

    function stepAndToggle(
      nextCounter,
      targetIndex,
      toggleOnAfter,
      toggleOffAfter,
    ) {
      const currentCounter = app.setCounter(nextCounter);

      const targetTriangle = leafTriangles[targetIndex];
      if (targetTriangle == null) {
        throw new Error('targetIndex should be the index of a leaf triangle');
      }

      let isActive = false;
      const renderedTriangles = new Set();
      let i = 0;
      while (renderedTriangles.size < totalTriangles) {
        if (i++ > 1000) {
          throw new Error('Infinite loop');
        }
        app.interrupt();

        var renderedTriangle = renderNextTriangle();
        if (isActive) {
          treeIsConsistent(currentCounter, targetIndex);
        } else {
          treeIsConsistent(currentCounter);
        }
        renderedTriangles.add(renderedTriangle);

        switch (renderedTriangle.index) {
          case toggleOnAfter:
            ReactNoop.performAnimationWork(() => {
              targetTriangle.activate();
            });
            ReactNoop.flushAnimationPri();
            isActive = true;
            treeIsConsistent(currentCounter, targetIndex);
            break;
          case toggleOffAfter:
            global.debug = true;
            ReactNoop.performAnimationWork(() => {
              targetTriangle.deactivate();
            });
            ReactNoop.flushAnimationPri();
            isActive = false;
            treeIsConsistent(currentCounter);
            global.debug = false;
            break;
          default:
            break;
        }
      }

      ReactNoop.flushUnitsOfWork(2);
      if (isActive) {
        treeIsConsistent(nextCounter, targetIndex);
      } else {
        treeIsConsistent(nextCounter);
      }
    }

    // Render the whole tree, without toggling any nodes. After each triangle,
    // the unit of work pointer is reset to the root, to simulate being
    // interrupted by the container's animation.
    stepWithoutYielding(1);

    // Now let's simulate the hover effect. Same as last time, but when were
    // partially done rendering, we'll schedule a hi-pri update to "activate"
    // a target leaf node. Then we'll render a bit more, and scheduling another
    // hi-pri update to "deactivate" that same node.
    stepAndToggle(2, 5, 5, 10);
    stepAndToggle(3, 22, 20, 22);
    stepAndToggle(4, 13, 10, 30);
    stepAndToggle(5, 7, 35, 38);
  });
});
