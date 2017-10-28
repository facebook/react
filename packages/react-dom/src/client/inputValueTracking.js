/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

type ValueTracker = {
  getValue(): string,
  setValue(value: string): void,
  stopTracking(): void,
};
type WrapperState = {_valueTracker: ?ValueTracker};
type ElementWithValueTracker = HTMLInputElement & WrapperState;

function isCheckable(elem: HTMLInputElement) {
  var type = elem.type;
  var nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (type === 'checkbox' || type === 'radio')
  );
}

function getTracker(node: ElementWithValueTracker) {
  return node._valueTracker;
}

function detachTracker(node: ElementWithValueTracker) {
  node._valueTracker = null;
}

function getValueFromNode(node: HTMLInputElement): string {
  var value = '';
  if (!node) {
    return value;
  }

  if (isCheckable(node)) {
    value = node.checked ? 'true' : 'false';
  } else {
    value = node.value;
  }

  return value;
}

function trackValueOnNode(node: any): ?ValueTracker {
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

  var tracker = {
    getValue() {
      return currentValue;
    },
    setValue(value) {
      currentValue = '' + value;
    },
    stopTracking() {
      detachTracker(node);
      delete node[valueField];
    },
  };
  return tracker;
}

var inputValueTracking = {
  // exposed for testing
  _getTrackerFromNode: getTracker,

  track(node: ElementWithValueTracker) {
    if (getTracker(node)) {
      return;
    }

    // TODO: Once it's just Fiber we can move this to node._wrapperState
    node._valueTracker = trackValueOnNode(node);
  },

  updateValueIfChanged(node: ElementWithValueTracker) {
    if (!node) {
      return false;
    }

    var tracker = getTracker(node);
    // if there is no tracker at this point it's unlikely
    // that trying again will succeed
    if (!tracker) {
      return true;
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(node);
    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }
    return false;
  },

  stopTracking(node: ElementWithValueTracker) {
    var tracker = getTracker(node);
    if (tracker) {
      tracker.stopTracking();
    }
  },
};

module.exports = inputValueTracking;
