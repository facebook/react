/**
 * @providesModule ReactEventTopLevelCallback
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactEvent = require('ReactEvent');
var ReactInstanceHandles = require('ReactInstanceHandles');

var getDOMNodeID = require('getDOMNodeID');

var _topLevelListenersEnabled = true;

var ReactEventTopLevelCallback = {

  /**
   * @param {boolean} enabled Whether or not all callbacks that have ever been
   * created with this module should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * For a given `topLevelType`, creates a callback that could be added as a
   * listener to the document. That top level callback will simply fix the
   * native events before invoking `handleTopLevel`.
   *
   * - Raw native events cannot be trusted to describe their targets correctly
   *   so we expect that the argument to the nested function has already been
   *   fixed.  But the `target` property may not be something of interest to
   *   React, so we find the most suitable target.  But even at that point, DOM
   *   Elements (the target ) can't be trusted to describe their IDs correctly
   *   so we obtain the ID in a reliable manner and pass it to
   *   `handleTopLevel`. The target/id that we found to be relevant to our
   *   framework are called `renderedTarget`/`renderedTargetID` respectively.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(fixedNativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }
      var renderedTarget = ReactInstanceHandles.getFirstReactDOM(
        fixedNativeEvent.target
      ) || ExecutionEnvironment.global;
      var renderedTargetID = getDOMNodeID(renderedTarget);
      var event = fixedNativeEvent;
      var target = renderedTarget;
      ReactEvent.handleTopLevel(topLevelType, event, renderedTargetID, target);
    };
  }

};

module.exports = ReactEventTopLevelCallback;
