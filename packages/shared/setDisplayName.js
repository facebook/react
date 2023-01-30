/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function setDisplayName(elementType: any, innerFn: any) {
  let ownName;
  Object.defineProperty(elementType, 'displayName', {
    enumerable: false,
    configurable: true,
    get: function() {
      return ownName;
    },
    set: function(name) {
      ownName = name;
      // The inner component shouldn't inherit this display name in most cases,
      // because the component may be used elsewhere.
      // But it's nice for anonymous functions to inherit the name,
      // so that our component-stack generation logic will display their frames.
      // An anonymous function generally suggests a pattern like:
      //  React.forwardRef((props, ref) => {...});
      //  or
      //  React.memo((props) => {...});
      // This kind of inner function is not used elsewhere so the side effect is okay.
      if (!innerFn.name && !innerFn.displayName) {
        innerFn.displayName = name;
      }
    },
  });
}

export default setDisplayName;
