/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var REACT_ELEMENT_TYPE;
var REACT_COROUTINE_TYPE;
var REACT_YIELD_TYPE;
var REACT_PORTAL_TYPE;
var REACT_FRAGMENT_TYPE;
if (typeof Symbol === 'function' && Symbol.for) {
  REACT_ELEMENT_TYPE = Symbol.for('react.element');
  REACT_COROUTINE_TYPE = Symbol.for('react.coroutine');
  REACT_YIELD_TYPE = Symbol.for('react.yield');
  REACT_PORTAL_TYPE = Symbol.for('react.portal');
  REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
} else {
  REACT_ELEMENT_TYPE = 0xeac7;
  REACT_COROUTINE_TYPE = 0xeac8;
  REACT_YIELD_TYPE = 0xeac9;
  REACT_PORTAL_TYPE = 0xeaca;
  REACT_FRAGMENT_TYPE = 0xeacb;
}

function is(object, type) {
  return (
    typeof object === 'object' && object !== null && object.$$typeof === type
  );
}

module.exports = {
  typeOf(object) {
    switch (typeof object === 'object' && object !== null && object.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return 'ReactElement';
      case REACT_COROUTINE_TYPE:
        return 'ReactCoroutine';
      case REACT_YIELD_TYPE:
        return 'ReactYield';
      case REACT_PORTAL_TYPE:
        return 'ReactPortal';
      case REACT_FRAGMENT_TYPE:
        return 'ReactFragment';
      default:
        return undefined;
    }
  },
  isElement(object) {
    return is(object, REACT_ELEMENT_TYPE);
  },
  isCoroutine(object) {
    return is(object, REACT_COROUTINE_TYPE);
  },
  isYield(object) {
    return is(object, REACT_YIELD_TYPE);
  },
  isPortal(object) {
    return is(object, REACT_PORTAL_TYPE);
  },
  isFragment(object) {
    return is(object, REACT_FRAGMENT_TYPE);
  },
};
