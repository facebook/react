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

var React = require('React');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactTestUtils = require('ReactTestUtils');

/**
 * Ensure that all callbacks are invoked, passing this unique argument.
 */
var ARG = {arg: true};
var ARG2 = {arg2: true};

class ChildComponent extends React.Component {
  render() {
    return (
      <div ref="DIV">
        <div ref="DIV_1" />
        <div ref="DIV_2" />
      </div>
    );
  }
}

class ParentComponent extends React.Component {
  render() {
    return (
      <div ref="P">
        <div ref="P_P1">
          <ChildComponent ref="P_P1_C1" />
          <ChildComponent ref="P_P1_C2" />
        </div>
        <div ref="P_OneOff" />
      </div>
    );
  }
}

function renderParentIntoDocument() {
  return ReactTestUtils.renderIntoDocument(<ParentComponent />);
}

describe('ReactDOMTreeTraversal', () => {
  var ReactDOMTreeTraversal;

  var aggregatedArgs;
  function argAggregator(inst, phase, arg) {
    aggregatedArgs.push({
      node: ReactDOMComponentTree.getNodeFromInstance(inst),
      phase: phase,
      arg: arg,
    });
  }

  function getInst(node) {
    return ReactDOMComponentTree.getInstanceFromNode(node);
  }

  beforeEach(() => {
    ReactDOMTreeTraversal = require('ReactDOMTreeTraversal');
    aggregatedArgs = [];
  });

  describe('traverseTwoPhase', () => {
    it('should not traverse when traversing outside DOM', () => {
      var expectedAggregation = [];
      ReactDOMTreeTraversal.traverseTwoPhase(null, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse two phase across component boundary', () => {
      var parent = renderParentIntoDocument();
      var target = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      var expectedAggregation = [
        {node: parent.refs.P, phase: 'captured', arg: ARG},
        {node: parent.refs.P_P1, phase: 'captured', arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV, phase: 'captured', arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV_1, phase: 'captured', arg: ARG},

        {node: parent.refs.P_P1_C1.refs.DIV_1, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P_P1_C1.refs.DIV, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P_P1, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P, phase: 'bubbled', arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseTwoPhase(target, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse two phase at shallowest node', () => {
      var parent = renderParentIntoDocument();
      var target = getInst(parent.refs.P);
      var expectedAggregation = [
        {node: parent.refs.P, phase: 'captured', arg: ARG},
        {node: parent.refs.P, phase: 'bubbled', arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseTwoPhase(target, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('traverseEnterLeave', () => {
    it('should not traverse when enter/leaving outside DOM', () => {
      var target = null;
      var expectedAggregation = [];
      ReactDOMTreeTraversal.traverseEnterLeave(
        target,
        target,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should not traverse if enter/leave the same node', () => {
      var parent = renderParentIntoDocument();
      var leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      var enter = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      var expectedAggregation = [];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse enter/leave to sibling - avoids parent', () => {
      var parent = renderParentIntoDocument();
      var leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      var enter = getInst(parent.refs.P_P1_C1.refs.DIV_2);
      var expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV_1, phase: 'bubbled', arg: ARG},
        // enter/leave shouldn't fire anything on the parent
        {node: parent.refs.P_P1_C1.refs.DIV_2, phase: 'captured', arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should traverse enter/leave to parent - avoids parent', () => {
      var parent = renderParentIntoDocument();
      var leave = getInst(parent.refs.P_P1_C1.refs.DIV_1);
      var enter = getInst(parent.refs.P_P1_C1.refs.DIV);
      var expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV_1, phase: 'bubbled', arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should enter from the window', () => {
      var parent = renderParentIntoDocument();
      var leave = null; // From the window or outside of the React sandbox.
      var enter = getInst(parent.refs.P_P1_C1.refs.DIV);
      var expectedAggregation = [
        {node: parent.refs.P, phase: 'captured', arg: ARG2},
        {node: parent.refs.P_P1, phase: 'captured', arg: ARG2},
        {node: parent.refs.P_P1_C1.refs.DIV, phase: 'captured', arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should enter from the window to the shallowest', () => {
      var parent = renderParentIntoDocument();
      var leave = null; // From the window or outside of the React sandbox.
      var enter = getInst(parent.refs.P);
      var expectedAggregation = [
        {node: parent.refs.P, phase: 'captured', arg: ARG2},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should leave to the window', () => {
      var parent = renderParentIntoDocument();
      var enter = null; // From the window or outside of the React sandbox.
      var leave = getInst(parent.refs.P_P1_C1.refs.DIV);
      var expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P_P1, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P, phase: 'bubbled', arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it('should leave to the window from the shallowest', () => {
      var parent = renderParentIntoDocument();
      var enter = null; // From the window or outside of the React sandbox.
      var leave = getInst(parent.refs.P_P1_C1.refs.DIV);
      var expectedAggregation = [
        {node: parent.refs.P_P1_C1.refs.DIV, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P_P1, phase: 'bubbled', arg: ARG},
        {node: parent.refs.P, phase: 'bubbled', arg: ARG},
      ];
      ReactDOMTreeTraversal.traverseEnterLeave(
        leave,
        enter,
        argAggregator,
        ARG,
        ARG2,
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('getFirstCommonAncestor', () => {
    it('should determine the first common ancestor correctly', () => {
      var parent = renderParentIntoDocument();
      var ancestors = [
        // Common ancestor with self is self.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
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
      var i;
      for (i = 0; i < ancestors.length; i++) {
        var plan = ancestors[i];
        var firstCommon = ReactDOMTreeTraversal.getLowestCommonAncestor(
          getInst(plan.one),
          getInst(plan.two),
        );
        expect(firstCommon).toBe(getInst(plan.com));
      }
    });
  });
});
