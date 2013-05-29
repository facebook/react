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

require('mock-modules')
    .dontMock('ReactInstanceHandles');

var React = require('React');
var ReactComponent = require('ReactComponent');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactTestUtils = require('ReactTestUtils');

var reactComponentExpect= require('reactComponentExpect');

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

var aggregatedArgs = [];
function argAggregator(id, isUp, arg) {
  aggregatedArgs.push({
    id: id,
    isUp: isUp,
    arg: arg
  });
}

var nextDescendantID;
var traverseTwoPhase;
var traverseEnterLeave;
var getFirstCommonAncestorID;

describe('ReactInstanceHandles traversal', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    aggregatedArgs = [];
    ReactInstanceHandles = require('ReactInstanceHandles');
    nextDescendantID = ReactInstanceHandles.nextDescendantID;
    getFirstCommonAncestorID = ReactInstanceHandles.getFirstCommonAncestorID;
    traverseTwoPhase = ReactInstanceHandles.traverseTwoPhase;
    traverseEnterLeave = ReactInstanceHandles.traverseEnterLeave;
  });

  it("should return next descendent from window", function() {
    var parent = renderParentIntoDocument();
    expect(nextDescendantID('', parent.refs.P_P1._rootNodeID)).toBe(
      parent.refs.P._rootNodeID
    );
  });

  it("should return window for next descendent towards window", function() {
    expect(nextDescendantID('', '')).toBe('');
  });

  it("should return self for next descendent towards self", function() {
    var parent = renderParentIntoDocument();
    expect(
      nextDescendantID(
        parent.refs.P_P1._rootNodeID,
        parent.refs.P_P1._rootNodeID
      )
    ).toBe(parent.refs.P_P1._rootNodeID);
  });

  it("should not traverse when traversing outside DOM", function() {
    var targetID = '';
    var expectedAggregation = [];
    traverseTwoPhase(targetID, argAggregator, ARG);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

  it("should not traverse when enter/leaving outside DOM", function() {
    var targetID = '';
    var expectedAggregation = [];
    traverseEnterLeave(targetID, targetID, argAggregator, ARG, ARG2);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

  it("should not traverse if enter/leave the same node", function() {
    var parent = renderParentIntoDocument();
    var leaveID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
    var enterID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
    var expectedAggregation = [];
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
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
    traverseTwoPhase(targetID, argAggregator, ARG);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

  it("should traverse two phase at shallowest node", function() {
    var parent = renderParentIntoDocument();
    var targetID = parent.refs.P._rootNodeID;
    var expectedAggregation = [
      {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG},
      {id: parent.refs.P._rootNodeID, isUp: true, arg: ARG}
    ];
    traverseTwoPhase(targetID, argAggregator, ARG);
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
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

  it("should traverse enter/leave to parent - avoids parent", function() {
    var parent = renderParentIntoDocument();
    var leaveID = parent.refs.P_P1_C1.refs.DIV_1._rootNodeID;
    var enterID = parent.refs.P_P1_C1.refs.DIV._rootNodeID;
    var expectedAggregation = [
      {id: parent.refs.P_P1_C1.refs.DIV_1._rootNodeID, isUp: true, arg: ARG}
    ];
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
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
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

  it("should enter from the window to the shallowest", function() {
    var parent = renderParentIntoDocument();
    var leaveID = ''; // From the window or outside of the React sandbox.
    var enterID = parent.refs.P._rootNodeID;
    var expectedAggregation = [
      {id: parent.refs.P._rootNodeID, isUp: false, arg: ARG2}
    ];
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
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
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
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
    traverseEnterLeave(leaveID, enterID, argAggregator, ARG, ARG2);
    expect(aggregatedArgs).toEqual(expectedAggregation);
  });

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
      var firstCommon = getFirstCommonAncestorID(
        plan.one._rootNodeID,
        plan.two._rootNodeID
      );
      expect(firstCommon).toBe(plan.com._rootNodeID);
    }
  });
});

describe('ReactInstanceHandles.getReactRootIDFromNodeID', function() {
  it('should support strings', function() {
    var test = '.reactRoot[s_0_1][0]..[1]';
    var expected = '.reactRoot[s_0_1]';
    var actual = ReactInstanceHandles.getReactRootIDFromNodeID(test);
    expect(actual).toEqual(expected);
  });
});
