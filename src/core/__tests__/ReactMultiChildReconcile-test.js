/**
 * Copyright 2013-2014 Facebook, Inc.
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

require('mock-modules');

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactMount = require('ReactMount');

var mapObject = require('mapObject');

var stripEmptyValues = function(obj) {
  var ret = {};
  var name;
  for (name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    if (obj[name] !== null && obj[name] !== undefined) {
      ret[name] = obj[name];
    }
  }
  return ret;
};

/**
 * Child key names are wrapped like '.$key:0'. We strip the extra chars out
 * here. This relies on an implementation detail of the rendering system.
 */
var getOriginalKey = function(childName) {
  var match = childName.match(/^\.\$([^.]+)\:0$/);
  expect(match).not.toBeNull();
  return match[1];
};

/**
 * Contains internal static internal state in order to test that updates to
 * existing children won't reinitialize components, when moving children -
 * reusing existing DOM/memory resources.
 */
var StatusDisplay = React.createClass({
  getInitialState: function() {
    return { internalState: Math.random() };
  },

  getStatus: function() {
    return this.props.status;
  },

  getInternalState: function() {
    return this.state.internalState;
  },

  render: function() {
    return (
      <div>
        {this.state.internalState}
      </div>
    );
  }
});

/**
 * Displays friends statuses.
 */
var FriendsStatusDisplay = React.createClass({
  /**
   * Retrieves the rendered children in a nice format for comparing to the input
   * `this.props.usernameToStatus`. Gets the order directly from each rendered
   * child's `index` field. Refs are not maintained in the rendered order, and
   * neither is `this._renderedChildren` (surprisingly).
   */
  getStatusDisplays: function() {
    var name;
    var orderOfUsernames = [];
    var statusDisplays = this._renderedComponent._renderedChildren;
    for (name in statusDisplays) {
      var child = statusDisplays[name];
      var isPresent = !!child;
      if (isPresent) {
        orderOfUsernames[child._mountIndex] = getOriginalKey(name);
      }
    }
    var res = {};
    var i;
    for (i = 0; i < orderOfUsernames.length; i++) {
      var key = orderOfUsernames[i];
      res[key] = this.refs[key];
    }
    return res;
  },
  render: function() {
    var children = null;
    var key;
    for (key in this.props.usernameToStatus) {
      var status = this.props.usernameToStatus[key];
      children = children || {};
      children[key] = !status ? null :
          <StatusDisplay ref={key} status={status} />;
    }
    return (
      <div>
        {children}
      </div>
    );
  }
});


function getInteralStateByUserName(statusDisplays) {
  return mapObject(statusDisplays, function(statusDisplay, key) {
    return statusDisplay.getInternalState();
  });
}

/**
 * Verifies that the rendered `StatusDisplay` instances match the `props` that
 * were responsible for allocating them. Checks the content of the user's status
 * message as well as the order of them.
 */
function verifyStatuses(statusDisplays, props) {
  var nonEmptyStatusDisplays = stripEmptyValues(statusDisplays);
  var nonEmptyStatusProps = stripEmptyValues(props.usernameToStatus);
  var username;
  expect(Object.keys(nonEmptyStatusDisplays).length)
    .toEqual(Object.keys(nonEmptyStatusProps).length);
  for (username in nonEmptyStatusDisplays) {
    if (!nonEmptyStatusDisplays.hasOwnProperty(username)) {
      continue;
    }
    expect(nonEmptyStatusDisplays[username].getStatus())
      .toEqual(nonEmptyStatusProps[username]);
  }

  // now go the other way to make sure we got them all.
  for (username in nonEmptyStatusProps) {
    if (!nonEmptyStatusProps.hasOwnProperty(username)) {
      continue;
    }
    expect(nonEmptyStatusDisplays[username].getStatus())
      .toEqual(nonEmptyStatusProps[username]);
  }

  expect(Object.keys(nonEmptyStatusDisplays))
      .toEqual(Object.keys(nonEmptyStatusProps));
}

/**
 * For all statusDisplays that existed in the previous iteration of the
 * sequence, verify that the state has been preserved. `StatusDisplay` contains
 * a unique number that allows us to track internal state across ordering
 * movements.
 */
function verifyStatesPreserved(lastInternalStates, statusDisplays) {
  var key;
  for (key in statusDisplays) {
    if (!statusDisplays.hasOwnProperty(key)) {
      continue;
    }
    if (lastInternalStates[key]) {
      expect(lastInternalStates[key])
        .toEqual(statusDisplays[key].getInternalState());
    }
  }
}


/**
 * Verifies that the internal representation of a set of `renderedChildren`
 * accurately reflects what is in the DOM.
 */
function verifyDomOrderingAccurate(parentInstance, statusDisplays) {
  var containerNode = parentInstance.getDOMNode();
  var statusDisplayNodes = containerNode.childNodes;
  var i;
  var orderedDomIds = [];
  for (i=0; i < statusDisplayNodes.length; i++) {
    orderedDomIds.push(ReactMount.getID(statusDisplayNodes[i]));
  }

  var orderedLogicalIds = [];
  var username;
  for (username in statusDisplays) {
    if (!statusDisplays.hasOwnProperty(username)) {
      continue;
    }
    var statusDisplay = statusDisplays[username];
    orderedLogicalIds.push(statusDisplay._rootNodeID);
  }
  expect(orderedDomIds).toEqual(orderedLogicalIds);
}

/**
 * Todo: Check that internal state is preserved across transitions
 */
function testPropsSequence(sequence) {
  var i;
  var parentInstance =
      ReactTestUtils.renderIntoDocument(FriendsStatusDisplay(sequence[0]));
  var statusDisplays = parentInstance.getStatusDisplays();
  var lastInternalStates = getInteralStateByUserName(statusDisplays);
  verifyStatuses(statusDisplays, sequence[0]);

  for (i = 1; i < sequence.length; i++) {
    parentInstance.replaceProps(sequence[i]);
    statusDisplays = parentInstance.getStatusDisplays();
    verifyStatuses(statusDisplays, sequence[i]);
    verifyStatesPreserved(lastInternalStates, statusDisplays);
    verifyDomOrderingAccurate(parentInstance, statusDisplays);

    lastInternalStates = getInteralStateByUserName(statusDisplays);
  }
}

describe('ReactMultiChildReconcile', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it('should reset internal state if removed then readded', function() {
    // Test basics.
    var props = {
      usernameToStatus: {
        jcw: 'jcwStatus'
      }
    };

    var parentInstance =
        ReactTestUtils.renderIntoDocument(FriendsStatusDisplay(props));
    var statusDisplays = parentInstance.getStatusDisplays();
    var startingInternalState = statusDisplays.jcw.getInternalState();

    // Now remove the child.
    parentInstance.replaceProps({ usernameToStatus: {} });
    statusDisplays = parentInstance.getStatusDisplays();
    expect(statusDisplays.jcw).toBeFalsy();

    // Now reset the props that cause there to be a child
    parentInstance.replaceProps(props);
    statusDisplays = parentInstance.getStatusDisplays();
    expect(statusDisplays.jcw).toBeTruthy();
    expect(statusDisplays.jcw.getInternalState())
        .toNotBe(startingInternalState);
  });

  it('should create unique identity', function() {
    // Test basics.
    var usernameToStatus = {
      jcw: 'jcwStatus',
      awalke: 'awalkeStatus',
      bob: 'bobStatus'
    };

    testPropsSequence([ { usernameToStatus: usernameToStatus } ]);
  });

  it('should preserve order if children order has not changed', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should transition from zero to one children correctly', function() {
    var PROPS_SEQUENCE = [
      { usernameToStatus: {} },
      {
        usernameToStatus: {
          first: 'firstStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should transition from one to zero children correctly', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          first: 'firstStatus'
        }
      },
      { usernameToStatus: {} }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should transition from one child to null children', function() {
    testPropsSequence([
      {
        usernameToStatus: {
          first: 'firstStatus'
        }
      },
      { }
    ]);
  });

  it('should transition from null children to one child', function() {
    testPropsSequence([
      { },
      {
        usernameToStatus: {
          first: 'firstStatus'
        }
      }
    ]);
  });

  it('should transition from zero children to null children', function() {
    testPropsSequence([
      {
        usernameToStatus: { }
      },
      { }
    ]);
  });

  it('should transition from null children to zero children', function() {
    testPropsSequence([
      { },
      {
        usernameToStatus: { }
      }
    ]);
  });



  /**
   * `FriendsStatusDisplay` renders nulls as empty children (it's a convention
   * of `FriendsStatusDisplay`, nothing related to React or these test cases.
   */
  it('should remove nulled out children at the beginning', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: null,
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should remove nulled out children at the end', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          jordanjcw: null
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should reverse the order of two children', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus'
        }
      },
      {
        usernameToStatus: {
          userTwo: 'userTwoStatus',
          userOne: 'userOneStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should reverse the order of more than two children', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus'
        }
      },
      {
        usernameToStatus: {
          userThree: 'userThreeStatus',
          userTwo: 'userTwoStatus',
          userOne: 'userOneStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should cycle order correctly', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus'
        }
      },
      {
        usernameToStatus: {
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus',
          userOne: 'userOneStatus'
        }
      },
      {
        usernameToStatus: {
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus',
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus'
        }
      },
      {
        usernameToStatus: {
          userFour: 'userFourStatus',
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus'
        }
      },
      {
        usernameToStatus: {               // Full circle!
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should cycle order correctly in the other direction', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus'
        }
      },
      {
        usernameToStatus: {
          userFour: 'userFourStatus',
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus'
        }
      },
      {
        usernameToStatus: {
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus',
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus'
        }
      },
      {
        usernameToStatus: {
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus',
          userOne: 'userOneStatus'
        }
      },
      {
        usernameToStatus: {               // Full circle!
          userOne: 'userOneStatus',
          userTwo: 'userTwoStatus',
          userThree: 'userThreeStatus',
          userFour: 'userFourStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });


  it('should remove nulled out children and ignore ' +
     'new null children', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jordanjcw: 'jordanjcwstatus2',
          jcw: null,
          another: null
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should remove nulled out children and reorder remaining', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus',
          john: 'johnStatus',  // john will go away
          joe: 'joeStatus'
        }
      },
      {
        usernameToStatus: {
          jordanjcw: 'jordanjcwStatus',
          joe: 'joeStatus',
          jcw: 'jcwStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should append children to the end', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus',
          jordanjcwnew: 'jordanjcwnewStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should append multiple children to the end', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus',
          jordanjcwnew: 'jordanjcwnewStatus',
          jordanjcwnew2: 'jordanjcwnewStatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should prepend children to the beginning', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          newUsername: 'newUsernameStatus',
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should prepend multiple children to the beginning', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          newNewUsername: 'newNewUsernameStatus',
          newUsername: 'newUsernameStatus',
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should not prepend an empty child to the beginning', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          emptyUsername: null,
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should not append an empty child to the end', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus',
          emptyUsername: null
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should not insert empty children in the middle', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          skipOverMe: null,
          skipOverMeToo: null,
          definitelySkipOverMe: null,
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should insert one new child in the middle', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          insertThis: 'insertThisStatus',
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should insert multiple new truthy children in the middle', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          insertThis: 'insertThisStatus',
          insertThisToo: 'insertThisTooStatus',
          definitelyInsertThisToo: 'definitelyInsertThisTooStatus',
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });

  it('should insert non-empty children in middle where nulls were', function() {
    var PROPS_SEQUENCE = [
      {
        usernameToStatus: {
          jcw: 'jcwStatus',
          insertThis: null,
          insertThisToo: null,
          definitelyInsertThisToo: null,
          jordanjcw: 'jordanjcwStatus'
        }
      },
      {
        usernameToStatus: {
          jcw: 'jcwstatus2',
          insertThis: 'insertThisStatus',
          insertThisToo: 'insertThisTooStatus',
          definitelyInsertThisToo: 'definitelyInsertThisTooStatus',
          jordanjcw: 'jordanjcwstatus2'
        }
      }
    ];
    testPropsSequence(PROPS_SEQUENCE);
  });
});
