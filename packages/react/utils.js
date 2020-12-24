/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */

function assign(target, source) {
  const getOwnPropertySymbols = Object.getOwnPropertySymbols;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const propIsEnumerable = Object.prototype.propertyIsEnumerable;
  let from;
  const to = toObject(target);
  let symbols;

  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError(
        'Assign function cannot be called with null or undefined',
      );
    }

    return Object(val);
  }

  for (let s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);

    for (const key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }

    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (let i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }

  return to;
}

export {assign};
