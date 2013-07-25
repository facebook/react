/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactMount = require('ReactMount');

/**
 * Ensure that all callbacks are invoked, passing this unique argument.
 */
var ARG = {arg: true};
var ARG2 = {arg2: true};

var ChildComponent = React.createClass({
  render: function() {
    return (
      <div ref="DIV">
        <div ref="DIV_1" />
        <div ref="DIV_2" />
      </div>
    );
  }
});

var ParentComponent = React.createClass({
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
  }
});

function renderParentIntoDocument() {
  return ReactTestUtils.renderIntoDocument(<ParentComponent />);
}

describe('ReactInstanceHandles', function() {
  var ReactInstanceHandles;

  var aggregatedArgs;
  function argAggregator(id, isUp, arg) {
    aggregatedArgs.push({
      id: id,
      isUp: isUp,
      arg: arg
    });
  }

  beforeEach(function() {
    ReactInstanceHandles = require('ReactInstanceHandles');
    aggregatedArgs = [];
  });

  describe('isRenderedByReact', function() {
    it('should not crash on text nodes', function() {
      expect(function() {
        ReactMount.isRenderedByReact(document.createTextNode('yolo'));
      }).not.toThrow();
    });
  });

  describe('findComponentRoot', function() {
    it('should find the correct node with prefix sibling IDs', function() {
      var parentNode = document.createElement('div');
      var childNodeA = document.createElement('div');
      var childNodeB = document.createElement('div');
      parentNode.appendChild(childNodeA);
      parentNode.appendChild(childNodeB);

      ReactMount.setID(parentNode, '.react[0]');
      ReactMount.setID(childNodeA, '.react[0].0');
      ReactMount.setID(childNodeB, '.react[0].0:1');

      expect(
        ReactMount.findComponentRoot(
          parentNode,
          ReactMount.getID(childNodeB)
        )
      ).toBe(childNodeB);
    });

    it('should work around unidentified nodes', function() {
      var parentNode = document.createElement('div');
      var childNodeA = document.createElement('div');
      var childNodeB = document.createElement('div');
      parentNode.appendChild(childNodeA);
      parentNode.appendChild(childNodeB);

      ReactMount.setID(parentNode, '.react[0]');
      // No ID on `childNodeA`.
      ReactMount.setID(childNodeB, '.react[0].0:1');

      expect(
        ReactMount.findComponentRoot(
          parentNode,
          ReactMount.getID(childNodeB)
        )
      ).toBe(childNodeB);
    });

    it('should throw if a rendered element cannot be found', function() {
      var parentNode = document.createElement('table');
      var childNodeA = document.createElement('tbody');
      var childNodeB = document.createElement('tr');
      parentNode.appendChild(childNodeA);
      childNodeA.appendChild(childNodeB);

      ReactMount.setID(parentNode, '.react[0]');
      // No ID on `childNodeA`, it was "rendered by the browser".
      ReactMount.setID(childNodeB, '.react[0].1:0');

      expect(ReactMount.findComponentRoot(
        parentNode,
        ReactMount.getID(childNodeB)
      )).toBe(childNodeB);

      spyOn(console, 'error');
      expect(console.error.argsForCall.length).toBe(0);

      expect(function() {
        ReactMount.findComponentRoot(
          parentNode,
          ReactMount.getID(childNodeB) + ":junk"
        );
      }).toThrow(
        'Invariant Violation: findComponentRoot(..., .react[0].1:0:junk): ' +
        'Unable to find element. This probably means the DOM was ' +
        'unexpectedly mutated (e.g. by the browser).'
      );

      expect(console.error.argsForCall.length).toBe(1);
    });
  });

  describe('getReactRootIDFromNodeID', function() {
    it('should support strings', function() {
      var test = '.r[s_0_1][0]..[1]';
      var expected = '.r[s_0_1]';
      var actual = ReactInstanceHandles.getReactRootIDFromNodeID(test);
      expect(actual).toEqual(expected);
    });
  });

  describe('traverseTwoPhase', function() {
    it("should not traverse when traversing outside DOM", function() {
      var targetID = '';
      var expectedAggregation = [];
      ReactInstanceHandles.traverseTwoPhase(targetID, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should traverse two phase across component boundary", function() {
      var parent = renderParentIntoDocument();
      var targetID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG},
        {id: parent.refs.P_P1._rootNodeID, isUp: false, arg: ARG},
        {id: parent.refs.P_P1_C1.refs.DIV._rootNodeID, isUp: false, arg: ARG},
        {id: parent.refs.P_P1_C1.refs.DIV_1._rootNodeID, isUp: false, arg: ARG},

        {id: parent.refs.P_P1_C1.refs.DIV_1._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P_P1_C1.refs.DIV._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P_P1._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P._rootNodeID, isUp: true, arg: ARG}
      ];
      ReactInstanceHandles.traverseTwoPhase(targetID, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should traverse two phase at shallowest node", function() {
      var parent = renderParentIntoDocument();
      var targetID = parent.refs.P._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG},
        {id: parent.refs.P._rootNodeID, isUp: true, arg: ARG}
      ];
      ReactInstanceHandles.traverseTwoPhase(targetID, argAggregator, ARG);
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('traverseEnterLeave', function() {
    it("should not traverse when enter/leaving outside DOM", function() {
      var targetID = '';
      var expectedAggregation = [];
      ReactInstanceHandles.traverseEnterLeave(
        targetID, targetID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should not traverse if enter/leave the same node", function() {
      var parent = renderParentIntoDocument();
      var leaveID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
      var enterID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
      var expectedAggregation = [];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should traverse enter/leave to sibling - avoids parent", function() {
      var parent = renderParentIntoDocument();
      var leaveID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
      var enterID = parent.refs.P_P1_C1.refs.DIV_2._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P_P1_C1.refs.DIV_1._rootNodeID, isUp: true, arg: ARG},
        // enter/leave shouldn't fire antyhing on the parent
        {id: parent.refs.P_P1_C1.refs.DIV_2._rootNodeID, isUp: false, arg: ARG2}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should traverse enter/leave to parent - avoids parent", function() {
      var parent = renderParentIntoDocument();
      var leaveID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
      var enterID = parent.refs.P_P1_C1.refs.DIV._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P_P1_C1.refs.DIV_1._rootNodeID, isUp: true, arg: ARG}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should enter from the window", function() {
      var parent = renderParentIntoDocument();
      var leaveID = ''; // From the window or outside of the React sandbox.
      var enterID = parent.refs.P_P1_C1.refs.DIV._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG2},
        {id: parent.refs.P_P1._rootNodeID, isUp: false, arg: ARG2},
        {id: parent.refs.P_P1_C1.refs.DIV._rootNodeID, isUp: false, arg: ARG2}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should enter from the window to the shallowest", function() {
      var parent = renderParentIntoDocument();
      var leaveID = ''; // From the window or outside of the React sandbox.
      var enterID = parent.refs.P._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG2}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should leave to the window", function() {
      var parent = renderParentIntoDocument();
      var enterID = ''; // From the window or outside of the React sandbox.
      var leaveID = parent.refs.P_P1_C1.refs.DIV._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P_P1_C1.refs.DIV._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P_P1._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P._rootNodeID, isUp: true, arg: ARG}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });

    it("should leave to the window from the shallowest", function() {
      var parent = renderParentIntoDocument();
      var enterID = ''; // From the window or outside of the React sandbox.
      var leaveID = parent.refs.P_P1_C1.refs.DIV._rootNodeID;
      var expectedAggregation = [
        {id: parent.refs.P_P1_C1.refs.DIV._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P_P1._rootNodeID, isUp: true, arg: ARG},
        {id: parent.refs.P._rootNodeID, isUp: true, arg: ARG}
      ];
      ReactInstanceHandles.traverseEnterLeave(
        leaveID, enterID, argAggregator, ARG, ARG2
      );
      expect(aggregatedArgs).toEqual(expectedAggregation);
    });
  });

  describe('getNextDescendantID', function() {
    it("should return next descendent from window", function() {
      var parent = renderParentIntoDocument();
      expect(
        ReactInstanceHandles._getNextDescendantID(
          '',
          parent.refs.P_P1._rootNodeID
        )
      ).toBe(parent.refs.P._rootNodeID);
    });

    it("should return window for next descendent towards window", function() {
      expect(ReactInstanceHandles._getNextDescendantID('', '')).toBe('');
    });

    it("should return self for next descendent towards self", function() {
      var parent = renderParentIntoDocument();
      expect(
        ReactInstanceHandles._getNextDescendantID(
          parent.refs.P_P1._rootNodeID,
          parent.refs.P_P1._rootNodeID
        )
      ).toBe(parent.refs.P_P1._rootNodeID);
    });
  });

  describe('getFirstCommonAncestorID', function() {
    it("should determine the first common ancestor correctly", function() {
      var parent = renderParentIntoDocument();
      var ancestors = [
        // Common ancestor from window to deep element is ''.
        { one: {_rootNodeID: ''},
          two: parent.refs.P_P1_C1.refs.DIV_1,
          com: {_rootNodeID: ''}
        },
        // Same as previous - reversed direction.
        { one: parent.refs.P_P1_C1.refs.DIV_1,
          two: {_rootNodeID: ''},
          com: {_rootNodeID: ''}
        },
        // Common ancestor from window to shallow id is ''.
        { one: parent.refs.P,
          two: {_rootNodeID: ''},
          com: {_rootNodeID: ''}
        },
        // Common ancestor with self is self.
        { one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV_1,
          com: parent.refs.P_P1_C1.refs.DIV_1
        },
        // Common ancestor with self is self - even if topmost DOM.
        { one: parent.refs.P, two: parent.refs.P, com: parent.refs.P },
        // Siblings
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV_2,
          com: parent.refs.P_P1_C1.refs.DIV
        },
        // Common ancestor with parent is the parent.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1.refs.DIV,
          com: parent.refs.P_P1_C1.refs.DIV
        },
        // Common ancestor with grandparent is the grandparent.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C1,
          com: parent.refs.P_P1_C1
        },
        // Grantparent across subcomponent boundaries.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_P1_C2.refs.DIV_1,
          com: parent.refs.P_P1
        },
        // Something deep with something one-off.
        {
          one: parent.refs.P_P1_C1.refs.DIV_1,
          two: parent.refs.P_OneOff,
          com: parent.refs.P
        }
      ];
      var i;
      for (i = 0; i < ancestors.length; i++) {
        var plan = ancestors[i];
        var firstCommon = ReactInstanceHandles._getFirstCommonAncestorID(
          plan.one._rootNodeID,
          plan.two._rootNodeID
        );
        expect(firstCommon).toBe(plan.com._rootNodeID);
      }
    });
  });

});
