/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

require('mock-modules')
    .dontMock('LegacyImmutableObject');

var LegacyImmutableObject;

/**
 * To perform performance testing of using `LegacyImmutableObject` vs. not using
 * `LegacyImmutableObject`, such testing must be done with __DEV__ set to false.
 */
describe('LegacyImmutableObject', function() {
  var message;
  beforeEach(function() {
    require('mock-modules').dumpCache();
    LegacyImmutableObject = require('LegacyImmutableObject');
    this.addMatchers({
      /**
       * Equivalent with respect to serialization. Must stringify because
       * constructors are different and other comparison methods will not
       * consider them structurally equal. Probably not useful for use outside
       * of this test module.
       */
      toBeSeriallyEqualTo: function(expected) {
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + JSON.stringify(actual) + notText +
              " to be serially equal to " + JSON.stringify(expected);
        };

        return JSON.stringify(actual) === JSON.stringify(expected);
      }
    });
  });

  /**
   * We are in __DEV__ by default.
   */
  var testDev = function(message, testFunc) {
    it(message, testFunc);
  };

  var testProd = function(message, testFunc) {
    // Temporarily enter production mode
    window.__DEV__ = false;
    it(message, testFunc);
    window.__DEV__ = true;
  };

  var testDevAndProd = function(message, testFunc) {
    testDev(message + ':DEV', testFunc);
    testProd(message + ':PROD', testFunc);
  };

  testDev('should be running in DEV', function() {
    expect(window.__DEV__).toBe(true);
  });

  testDev('should require initial map to be an object', function() {
    expect(function() {
      new LegacyImmutableObject([1,2,3]);
    }).toThrow();

    expect(function() {
      new LegacyImmutableObject('asdf');
    }).toThrow();

    expect(function() {
      new LegacyImmutableObject({oldField: 'asdf', fieldTwo: null});
    }).not.toThrow();
  });

  testDev('should not exceed maximum call stack size with nodes', function() {
    var node = document.createElement('div');
    var object = new LegacyImmutableObject({node: node});
    expect(object.node).toBe(node);
  });

  testDevAndProd('should not throw when not mutating directly', function() {
    var io = new LegacyImmutableObject({oldField: 'asdf'});
    expect(function() {
      LegacyImmutableObject.set(io, {newField: null}); // not a mutation!
    }).not.toThrow();
  });

  testDev('should prevent shallow field addition when strict', function() {
    expect(function() {
      var io = new LegacyImmutableObject({oldField: 'asdf'});
      io.newField = 'this will not work';
    }).toThrow();
  });

  testDev('should prevent shallow field mutation when strict', function() {
    expect(function() {
      var io = new LegacyImmutableObject({oldField: 'asdf'});
      io.oldField = 'this will not work!';
    }).toThrow();
  });

  testDev('should prevent deep field addition when strict', function() {
    expect(function() {
      var io =
        new LegacyImmutableObject(
          {shallowField: {deepField: {oldField: null}}}
        );
      io.shallowField.deepField.oldField = 'this will not work!';
    }).toThrow();
  });

  testDev('should prevent deep field mutation when strict', function() {
    expect(function() {
      var io =
        new LegacyImmutableObject(
          {shallowField: {deepField: {oldField: null}}}
        );
      io.shallowField.deepField.newField = 'this will not work!';
    }).toThrow();
  });

  testDevAndProd(
    'should create object with same structure when set with {}',
    function() {
      var beforeIO =
        new LegacyImmutableObject(
          {shallowField: {deepField: {oldField: null}}}
        );
      var afterIO = LegacyImmutableObject.set(beforeIO, {});
      expect(afterIO).toBeSeriallyEqualTo(beforeIO);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  testDevAndProd(
    'should create distinct object with shallow field insertion',
    function() {
      var beforeStructure = {
        oldShallowField: {
          deepField: {
            oldField: null
          }
        }
      };

      var delta = {
        newShallowField: 'newShallowFieldHere'
      };

      var expectedAfterStructure = {
        oldShallowField: {
          deepField: {
            oldField: null
          }
        },
        newShallowField: 'newShallowFieldHere'
      };

      var beforeIO = new LegacyImmutableObject(beforeStructure);
      var afterIO = LegacyImmutableObject.set(beforeIO, delta);
      expect(afterIO).toBeSeriallyEqualTo(expectedAfterStructure);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  testDevAndProd(
    'should create distinct object with shallow field mutation',
      function() {
      var beforeStructure = {
        oldShallowField: {
          deepField: {
            oldField: null
          }
        }
      };

      var delta = {
        oldShallowField: 'this will clobber the old field'
      };

      var expectedAfterStructure = {
        oldShallowField: 'this will clobber the old field'
      };

      var beforeIO = new LegacyImmutableObject(beforeStructure);
      var afterIO = LegacyImmutableObject.set(beforeIO, delta);
      expect(afterIO).toBeSeriallyEqualTo(expectedAfterStructure);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  message = 'should create distinct object with deep field insertion';
  testDevAndProd(message, function() {
    var beforeStructure = {
      oldShallowField: {
        deepField: {
          oldField: null
        }
      }
    };

    var delta = {
      oldShallowField: {newDeepField: 'hello'}
    };

    // LegacyImmutableObject does not yet support deep merging with
    // LegacyImmutableObject.set().
    var expectedAfterStructure = {
      oldShallowField: {newDeepField: 'hello'}
    };

    var beforeIO = new LegacyImmutableObject(beforeStructure);
    var afterIO = LegacyImmutableObject.set(beforeIO, delta);
    expect(afterIO).toBeSeriallyEqualTo(expectedAfterStructure);
    expect(afterIO).not.toBe(beforeIO);
  });

  message =
    'should tolerate arrays at deeper levels and prevent mutation on them';
  testDevAndProd(message, function() {
    if (window.callPhantom) {
      // PhantomJS has a bug with Object.freeze and Arrays.
      // https://github.com/ariya/phantomjs/issues/10817
      return;
    }
    var beforeStructure = {
      shallowField: [1,'second field',3]
    };
    var io = new LegacyImmutableObject(beforeStructure);
    expect(function() {
      io.newField = 'nope!';
    }).toThrow();
    expect(function() {
      io.shallowField[0] = 'nope!';
    }).toThrow();
    expect(io.shallowField[1]).toEqual('second field');
  });

  message = 'should provide a setField interface as sugar for set()';
  testDevAndProd(message, function() {
    var beforeIO = new LegacyImmutableObject({initialField: null});
    var afterIO =
      LegacyImmutableObject.setField(beforeIO, 'anotherField', 'anotherValue');
    expect(afterIO).toBeSeriallyEqualTo({
      initialField: null,
      anotherField: 'anotherValue'
    });
    expect(afterIO).not.toBe(beforeIO);
  });

  message = 'should recursively create distinct objects when deep copying';
  testDevAndProd(message, function() {
    var beforeIO = new LegacyImmutableObject({
      a: {b: 'b', c: {}, d: 'd', e: new LegacyImmutableObject({f: 'f'}) }
    });
    var afterIO = LegacyImmutableObject.setDeep(beforeIO, {
      a: {b: {}, c: 'C', e: {f: 'F', g: 'G'}, h: 'H'}
    });
    expect(afterIO).toBeSeriallyEqualTo({
      a: {b: {}, c: 'C', d: 'd', e: {f: 'F', g: 'G'}, h: 'H'}
    });
    expect(afterIO).not.toBe(beforeIO);
    expect(afterIO.a).not.toBe(beforeIO.a);
    expect(afterIO.a.e).not.toBe(beforeIO.a.e);
  });

  testDevAndProd('should deep copy member immutability', function() {
    var beforeIO = new LegacyImmutableObject({
      a: {b: new LegacyImmutableObject({c: 'c'}), e: {f: 'f'}}
    });
    var afterIO = LegacyImmutableObject.setDeep(beforeIO, {
      a: {b: {d: 'D'}, e: new LegacyImmutableObject({g: 'G'})}
    });
    expect(afterIO).toBeSeriallyEqualTo({
      a: {b: {c: 'c', d: 'D'}, e: {f: 'f', g: 'G'}}
    });
    expect(afterIO instanceof LegacyImmutableObject).toBe(true);
    expect(afterIO.a.b instanceof LegacyImmutableObject).toBe(true);
    expect(afterIO.a.e instanceof LegacyImmutableObject).toBe(true);
  });
});
