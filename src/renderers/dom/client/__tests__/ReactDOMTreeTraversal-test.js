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

const React = require('React');
const ReactDOMComponentTree = require('ReactDOMComponentTree');
const ReactTestUtils = require('ReactTestUtils');

/**
 * Ensure that all callbacks are invoked, passing this unique argument.
 */
const ARG = {arg: true};
const ARG2 = {arg2: true};

const ChildComponent = React.createClass({
  render: function() {
    return (
      <div ref="DIV">
        <div ref="DIV_1" />
        <div ref="DIV_2" />
      </div>
    );
  },
});

const ParentComponent = React.createClass({
  render: function() {
    return (
      <div ref="P">
        <div ref="P_P1">
          <ChildComponent ref="P_P1_C1" />
          <ChildComponent ref="P_P1_C2" />
        </div>
        <div ref="P_OneOff" />
      </div>
    );
  },
});

function renderParentIntoDocument() {
  return ReactTestUtils.renderIntoDocument(<ParentComponent />);
}

describe('ReactDOMTreeTraversal', function() {
  let ReactDOMTreeTraversal;

  let aggregatedArgs;
  function argAggregator(inst, isUp, arg) {
    aggregatedArgs.push({
      node: ReactDOMComponentTree.getNodeFromInstance(inst),
      isUp: isUp,
      arg: arg,
    });
  }

  function getInst(node) {
    return ReactDOMComponentTree.getInstanceFromNode(node);
  }

  beforeEach(function() {
    ReactDOMTreeTraversal = require('ReactDOMTreeTraversal');
    aggregatedArgs = [];
  });

  describe('traverseTwoPhase', function() {
    it('should not traverse when traversing outside DOM', function() {
      const expectedAggregation = [];
      ReactDOMTreeTraversal.traverseTwoPhase(null, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse two phase across component boundary', function() {
      const parent = renderParentIntoDocument();
      const target = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      const expectedAggregation = [
        {node: parent.refs.P, isUp: false, arg: ARG},
        {node: parent.refs.P_P1, isUp: false, arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV, isUp: false, arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV_1, isUp: false, arg: ARG},

        {node: parent.refs.P_P1_C1.refs.DIV_1, isUp: true, arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV, isUp: true, arg: ARG},
        {node: parent.refs.P_P1, isUp: true, arg: ARG},
        {node: parent.refs.P, isUp: true, arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseTwoPhase(target, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse two phase at shallowest node', function() {
      const parent = renderParentIntoDocument();
      const target = getInst(parent.refs.P);
      const expectedAggregation = [
        {node: parent.refs.P, isUp: false, arg: ARG},
        {node: parent.refs.P, isUp: true, arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseTwoPhase(target, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('traverseEnterLeave', function() {
    it('should not traverse when enter/leaving outside DOM', function() {
      const target = null;
      const expectedAggregation = [];
      ReactDOMTreeTraversal.traverseEnterLeave(
        target, target, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should not traverse if enter/leave the same node', function() {
      const parent = renderParentIntoDocument();
      const leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      const enter = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      const expectedAggregation = [];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse enter/leave to sibling - avoids parent', function() {
      const parent = renderParentIntoDocument();
      const leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      const enter = getInst(parent.refs.P_P1_C1.refs.DIV_2);
      const expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV_1, isUp: true, arg: ARG},
        // enter/leave shouldn't fire anything on the parent
        {node: parent.refs.P_P1_C1.refs.DIV_2, isUp: false, arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse enter/leave to parent - avoids parent', function() {
      const parent = renderParentIntoDocument();
      const leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      const enter = getInst(parent.refs.P_P1_C1.refs.DIV);
      const expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV_1, isUp: true, arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should enter from the window', function() {
      const parent = renderParentIntoDocument();
      const leave = null; // From the window or outside of the React sandbox.
      const enter = getInst(parent.refs.P_P1_C1.refs.DIV);
      const expectedAggregation = [
        {node: parent.refs.P, isUp: false, arg: ARG2},
        {node: parent.refs.P_P1, isUp: false, arg: ARG2},
        {node: parent.refs.P_P1_C1.refs.DIV, isUp: false, arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should enter from the window to the shallowest', function() {
      const parent = renderParentIntoDocument();
      const leave = null; // From the window or outside of the React sandbox.
      const enter = getInst(parent.refs.P);
      const expectedAggregation = [
        {node: parent.refs.P, isUp: false, arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should leave to the window', function() {
      const parent = renderParentIntoDocument();
      const enter = null; // From the window or outside of the React sandbox.
      const leave = getInst(parent.refs.P_P1_C1.refs.DIV);
      const expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV, isUp: true, arg: ARG},
        {node: parent.refs.P_P1, isUp: true, arg: ARG},
        {node: parent.refs.P, isUp: true, arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should leave to the window from the shallowest', function() {
      const parent = renderParentIntoDocument();
      const enter = null; // From the window or outside of the React sandbox.
      const leave = getInst(parent.refs.P_P1_C1.refs.DIV);
      const expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV, isUp: true, arg: ARG},
        {node: parent.refs.P_P1, isUp: true, arg: ARG},
        {node: parent.refs.P, isUp: true, arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave, enter, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('getFirstCommonAncestor', function() {
    it('should determine the first common ancestor correctly', function() {
      const parent = renderParentIntoDocument();
      const ancestors = [
        // Common ancestor with self is self.
        {one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV_1,
          com: parent.refs.P_P1_C1.refs.DIV_1,
        },
        // Common ancestor with self is self - even if topmost DOM.
        {one: parent.refs.P, two: parent.refs.P, com: parent.refs.P},
        // Siblings
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV_2,
          com: parent.refs.P_P1_C1.refs.DIV,
        },
        // Common ancestor with parent is the parent.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV,
          com: parent.refs.P_P1_C1.refs.DIV,
        },
        // Common ancestor with grandparent is the grandparent.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1,
          com: parent.refs.P_P1,
        },
        // Grandparent across subcomponent boundaries.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C2.refs.DIV_1,
          com: parent.refs.P_P1,
        },
        // Something deep with something one-off.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_OneOff,
          com: parent.refs.P,
        },
      ];
      let i;
      for (i = 0; i < ancestors.length; i++) {
        const plan = ancestors[i];
        const firstCommon = ReactDOMTreeTraversal.getLowestCommonAncestor(
          getInst(plan.one),
          getInst(plan.two)
        );
        expect(firstCommon).toBe(getInst(plan.com));
      }
    });
  });

});
