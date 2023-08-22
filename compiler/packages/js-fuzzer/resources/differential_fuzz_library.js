// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Helpers for printing in correctness fuzzing.

// Global helper functions for printing.
var __prettyPrint;
var __prettyPrintExtra;

// Track caught exceptions.
var __caught = 0;

// Track a hash of all printed values - printing is cut off after a
// certain size.
var __hash = 0;

(function() {
  const charCodeAt = String.prototype.charCodeAt;
  const join = Array.prototype.join;
  const map = Array.prototype.map;
  const substring = String.prototype.substring;
  const toString = Object.prototype.toString;

  // Same as in mjsunit.js.
  const classOf = function(object) {
    // Argument must not be null or undefined.
    const string = toString.call(object);
    // String has format [object <ClassName>].
    return substring.call(string, 8, string.length - 1);
  };

  // For standard cases use original prettyPrinted from mjsunit.
  const origPrettyPrinted = prettyPrinted;

  // Override prettyPrinted with a version that also recusively prints objects
  // and arrays with a depth of 4. We don't track circles, but we'd cut off
  // after a depth of 4 if there are any.
  prettyPrinted = function prettyPrinted(value, depth=4) {
    if (depth <= 0) {
      return "...";
    }
    switch (typeof value) {
      case "object":
        if (value === null) return "null";
        switch (classOf(value)) {
          case "Array":
            return prettyPrintedArray(value, depth);
          case "Object":
            return prettyPrintedObject(value, depth);
        }
    }
    // Fall through to original version for all other types.
    return origPrettyPrinted(value);
  }

  // Helper for pretty array with depth.
  function prettyPrintedArray(array, depth) {
    const result = map.call(array, (value, index, array) => {
      if (value === undefined && !(index in array)) return "";
      return prettyPrinted(value, depth - 1);
    });
    return `[${join.call(result, ", ")}]`;
  }

  // Helper for pretty objects with depth.
  function prettyPrintedObject(object, depth) {
    const keys = Object.keys(object);
    const prettyValues = map.call(keys, (key) => {
      return `${key}: ${prettyPrinted(object[key], depth - 1)}`;
    });
    const content = join.call(prettyValues, ", ");
    return `${object.constructor.name || "Object"}{${content}}`;
  }

  // Helper for calculating a hash code of a string.
  function hashCode(str) {
      let hash = 0;
      if (str.length == 0) {
          return hash;
      }
      for (let i = 0; i < str.length; i++) {
          const char = charCodeAt.call(str, i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
      }
      return hash;
  }

  // Upper limit for calling extra printing. When reached, hashes of
  // strings are tracked and printed instead.
  let maxExtraPrinting = 100;

  // Helper for pretty printing.
  __prettyPrint = function(value, extra=false) {
    let str = prettyPrinted(value);

    // Change __hash with the contents of the full string to
    // keep track of differences also when we don't print.
    const hash = hashCode(str);
    __hash = hashCode(hash + __hash.toString());

    if (extra && maxExtraPrinting-- <= 0) {
      return;
    }

    // Cut off long strings to prevent overloading I/O. We still track
    // the hash of the full string.
    if (str.length > 64) {
      const head = substring.call(str, 0, 54);
      const tail = substring.call(str, str.length - 10, str.length - 1);
      str = `${head}[...]${tail}`;
    }

    print(str);
  };

  __prettyPrintExtra = function (value) {
    __prettyPrint(value, true);
  }
})();
