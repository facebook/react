/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule inputValueTracking
 * @flow
 */

'use strict';

var {ELEMENT_NODE} = require('HTMLNodeType');
import type {Fiber} from 'ReactFiber';
import type {ReactInstance} from 'ReactInstanceType';

type ValueTracker = {
  getValue(): string,
  setValue(value: string): void,
  stopTracking(): void,
};
type WrapperState = {_wrapperState: {valueTracker: ?ValueTracker}};
type ElementWithWrapperState = Element & WrapperState;
type InstanceWithWrapperState = ReactInstance & WrapperState;
type SubjectWithWrapperState =
  | InstanceWithWrapperState
  | ElementWithWrapperState;

var ReactDOMComponentTree = require('ReactDOMComponentTree');

function isCheckable(elem: any) {
  var type = elem.type;
  var nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (type === 'checkbox' || type === 'radio')
  );
}

function getTracker(inst: any) {
  if (typeof inst.tag === 'number') {
    inst = inst.stateNode;
  }
  return inst._wrapperState.valueTracker;
}

function detachTracker(subject: SubjectWithWrapperState) {
  subject._wrapperState.valueTracker = null;
}

function getValueFromNode(node: any) {
  var value;
  if (node) {
    value = isCheckable(node) ? '' + node.checked : node.value;
  }
  return value;
}

function trackValueOnNode(node: any, inst: any): ?ValueTracker {
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
      detachTracker(inst);
      delete node[valueField];
    },
  };
  return tracker;
}

var inputValueTracking = {
  // exposed for testing
  _getTrackerFromNode(node: ElementWithWrapperState) {
    return getTracker(ReactDOMComponentTree.getInstanceFromNode(node));
  },

  trackNode(node: ElementWithWrapperState) {
    if (getTracker(node)) {
      return;
    }
    node._wrapperState.valueTracker = trackValueOnNode(node, node);
  },

  track(inst: InstanceWithWrapperState) {
    if (getTracker(inst)) {
      return;
    }
    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    inst._wrapperState.valueTracker = trackValueOnNode(node, inst);
  },

  // TODO: in practice "subject" can currently be Stack instance,
  // Fiber, or DOM node. This is hard to understand. We should either
  // make it accept only DOM nodes, or only Fiber/Stack instances.
  updateValueIfChanged(subject: SubjectWithWrapperState | Fiber) {
    if (!subject) {
      return false;
    }

    var isNode = (subject: any).nodeType === ELEMENT_NODE;
    var tracker = getTracker(subject);
    if (!tracker) {
      if (isNode) {
        // DOM node
        inputValueTracking.trackNode((subject: any));
      } else if (typeof (subject: any).tag === 'number') {
        // Fiber
        inputValueTracking.trackNode((subject: any).stateNode);
      } else {
        // Stack
        inputValueTracking.track((subject: any));
      }
      return true;
    }

    var node;
    if (isNode) {
      // DOM node
      node = subject;
    } else {
      // Fiber and Stack
      node = ReactDOMComponentTree.getNodeFromInstance(subject);
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(node);
    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }

    return false;
  },

  stopTracking(inst: InstanceWithWrapperState | Fiber) {
    var tracker = getTracker(inst);
    if (tracker) {
      tracker.stopTracking();
    }
  },
};

module.exports = inputValueTracking;
