if (typeof jasmine == 'undefined') jasmine = require("./jasmine");
var spec = false; // TODO

// Add some matcher for mock functions
jasmine.getEnv().beforeEach(function() {
  this.addMatchers({
    toBeCalled: function() {
      if (this.actual.mock === undefined) {
        throw Error('toBeCalled() should be used on a mock function');
      }
      return this.actual.mock.calls.length !== 0;
    },

    lastCalledWith: function() {
      if (this.actual.mock === undefined) {
        throw Error('lastCalledWith() should be used on a mock function');
      }
      var calls = this.actual.mock.calls;
      var args = Array.prototype.slice.call(arguments);
      return this.env.equals_(calls[calls.length - 1], args);
    },

    toBeCalledWith: function() {
      if (this.actual.mock === undefined) {
        throw Error('toBeCalledWith() should be used on a mock function');
      }
      var args = Array.prototype.slice.call(arguments);
      return this.actual.mock.calls.some(function(call) {
        return this.env.equals_(call, args);
      }.bind(this));
    }
  });
});

var _it = jasmine.Env.prototype.it;
var _xit = jasmine.Env.prototype.xit;
jasmine.Env.prototype.it = function(desc, func) {
  // If spec is provided, only run matching specs
  if (!spec || desc.match(new RegExp(spec, 'i'))) {
    return _it.call(this, desc, func);
  } else {
    return this.xit(desc, func);
  }
};
jasmine.Env.prototype.xit = function(desc, func) {
  if (typeof func == 'function') {
    var matches = func.toString().match(/.*\W?expect\(/g);
    if (matches) {
      this.reporter.subReporters_[0].skipCount += matches.length;
      this.reporter.subReporters_[0].totalCount += matches.length;
    }
  }
  return _xit.call(this, desc, func);
}

// Mainline Jasmine sets __Jasmine_been_here_before__ on each object to detect
// cycles, but that doesn't work on frozen objects so we use a WeakMap instead.
// We can only do this if if WeakMap is available, but if WeakMap is
// unavailable, then objects probably can't be frozen anyway.

if (typeof WeakMap !== "undefined") {
  var _comparedObjects = new WeakMap;

  jasmine.Env.prototype.compareObjects_ =
  function(a, b, mismatchKeys, mismatchValues) {
    if (_comparedObjects.get(a) === b && _comparedObjects.get(b) === a) {
      return true;
    }
    var areArrays = jasmine.isArray_(a) && jasmine.isArray_(b);

    _comparedObjects.set(a, b);
    _comparedObjects.set(b, a);

    var hasKey = function(obj, keyName) {
      return obj != null && obj[keyName] !== jasmine.undefined;
    };

    for (var property in b) {
      if (areArrays && typeof b[property] == 'function') {
        continue;
      }
      if (!hasKey(a, property) && hasKey(b, property)) {
        mismatchKeys.push(
          "expected has key '" + property + "', but missing from actual."
        );
      }
    }
    for (property in a) {
      if (areArrays && typeof a[property] == 'function') {
        continue;
      }
      if (!hasKey(b, property) && hasKey(a, property)) {
        mismatchKeys.push(
          "expected missing key '" + property + "', but present in actual."
        );
      }
    }
    for (property in b) {
      // The only different implementation from the original jasmine
      if (areArrays &&
          (typeof a[property] == 'function' ||
           typeof b[property] == 'function')) {
        continue;
      }
      if (!this.equals_(a[property], b[property], mismatchKeys, mismatchValues))
      {
        mismatchValues.push(
          "'" + property + "' was '" + (b[property] ?
            jasmine.util.htmlEscape(b[property].toString()) :
            b[property]) +
          "' in expected, but was '" + (a[property] ?
            jasmine.util.htmlEscape(a[property].toString()) :
            a[property]) + "' in actual."
        );
      }
    }

    if (areArrays &&
        a.length != b.length) {
      mismatchValues.push("arrays were not the same length");
    }

    _comparedObjects["delete"](a);
    _comparedObjects["delete"](b);
    return (mismatchKeys.length == 0 && mismatchValues.length == 0);
  };
}
