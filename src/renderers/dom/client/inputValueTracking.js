/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule inputValueTracking
 */

'use strict';
var ReactDOMComponentTree = require('ReactDOMComponentTree');

function isCheckable(elem) {
  var type = elem.type;
  var nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (type === 'checkbox' || type === 'radio')
  );
}

function getTracker(inst) {
  return inst._wrapperState.valueTracker;
}

function attachTracker(inst, tracker) {
  inst._wrapperState.valueTracker = tracker;
}

function detachTracker(inst) {
  delete inst._wrapperState.valueTracker;
}

function getValueFromNode(node) {
  var value;
  if (node) {
    value = isCheckable(node) ? '' + node.checked : node.value;
  }
  return value;
}

var inputValueTracking = {
  // exposed for testing
  _getTrackerFromNode(node) {
    return getTracker(ReactDOMComponentTree.getInstanceFromNode(node));
  },

  track: function(inst) {
    if (getTracker(inst)) {
      return;
    }

    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    var valueField = isCheckable(node) ? 'checked' : 'value';
    var descriptor = Object.getOwnPropertyDescriptor(
      node.constructor.prototype,
      valueField,
    );

    var currentValue = '' + node[valueField];

    // if someone has already defined a value or Safari, then bail
    // and don't track value will cause over reporting of changes,
    // but it's better then a hard failure
    // (needed for certain tests that spyOn input values and Safari)
    if (
      node.hasOwnProperty(valueField) ||
      typeof descriptor.get !== 'function' ||
      typeof descriptor.set !== 'function'
    ) {
      return;
    }

    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable,
      configurable: true,
      get: function() {
        return descriptor.get.call(this);
      },
      set: function(value) {
        currentValue = '' + value;
        descriptor.set.call(this, value);
      },
    });

    attachTracker(inst, {
      getValue() {
        return currentValue;
      },
      setValue(value) {
        currentValue = '' + value;
      },
      stopTracking() {
        detachTracker(inst);
        delete node[valueField];
      },
    });
  },

  updateValueIfChanged(inst) {
    if (!inst) {
      return false;
    }
    var tracker = getTracker(inst);

    if (!tracker) {
      inputValueTracking.track(inst);
      return true;
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(
      ReactDOMComponentTree.getNodeFromInstance(inst),
    );

    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }

    return false;
  },

  stopTracking(inst) {
    var tracker = getTracker(inst);
    if (tracker) {
      tracker.stopTracking();
    }
  },
};

module.exports = inputValueTracking;
