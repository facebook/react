/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

const hasOwnProperty = Object.prototype.hasOwnProperty;

const _assign = function(to, from) {
  for (const key in from) {
    if (hasOwnProperty.call(from, key)) {
      to[key] = from[key];
    }
  }
};

export default Object.assign ||
  function(target, sources) {
    if (target == null) {
      throw new TypeError('Object.assign target cannot be null or undefined');
    }

    const to = Object(target);

    for (let nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
      const nextSource = arguments[nextIndex];
      if (nextSource != null) {
        _assign(to, Object(nextSource));
      }
    }

    return to;
  };
