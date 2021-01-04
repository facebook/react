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

var ImmutableObject;
var Immutable;

/**
 * To perform performance testing of using `ImmutableObject` vs. not using
 * `ImmutableObject`, such testing must be done with __DEV__ set to false.
 */
describe('ImmutableObject', function() {
  var message;
  beforeEach(function() {
    ImmutableObject = require('ImmutableObject');
    Immutable = require('Immutable');
  });

  var testDev = function(message, testFunc) {
    it(message, function() {
      var old = window.__DEV__;
      window.__DEV__ = true;
      testFunc();
      window.__DEV__ = old;
    });
  };

  var testProd = function(message, testFunc) {
    it(message, function() {
      // Temporarily enter production mode
      var old = window.__DEV__;
      window.__DEV__ = false;
      testFunc();
      window.__DEV__ = old;
    });
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
      new ImmutableObject([1,2,3]);
    }).toThrow();

    expect(function() {
      new ImmutableObject('asdf');
    }).toThrow();

    expect(function() {
      new ImmutableObject({oldField: 'asdf', fieldTwo: null});
    }).not.toThrow();
  });

  testDevAndProd('should extend Immutable', function() {
    var object = new ImmutableObject({foo: 'bar'});
    expect (object instanceof Immutable).toBe(true);
    expect (object instanceof ImmutableObject).toBe(true);
  });

  testDev('should not exceed maximum call stack size with nodes', function() {
    var node = document.createElement('div');
    var object = new ImmutableObject({node: node});
    expect(object.node).toBe(node);
  });

  testDevAndProd('should not throw when not mutating directly', function() {
    var io = new ImmutableObject({oldField: 'asdf'});
    expect(function() {
      ImmutableObject.set(io, {newField: null}); // not a mutation!
    }).not.toThrow();
  });

  testDev('should prevent shallow field addition when strict', function() {
    if (window.callPhantom) return;
    expect(function() {
      var io = new ImmutableObject({oldField: 'asdf'});
      io.newField = 'this will not work';
    }).toThrow();
  });

  testDev('should prevent shallow field mutation when strict', function() {
    if (window.callPhantom) return;
    expect(function() {
      var io = new ImmutableObject({oldField: 'asdf'});
      io.oldField = 'this will not work!';
    }).toThrow();
  });

  testDev('should prevent deep field addition when strict', function() {
    if (window.callPhantom) return;
    expect(function() {
      var io =
        new ImmutableObject({shallowField: {deepField: {oldField: null}}});
      io.shallowField.deepField.oldField = 'this will not work!';
    }).toThrow();
  });

  testDev('should prevent deep field mutation when strict', function() {
    if (window.callPhantom) return;
    expect(function() {
      var io =
        new ImmutableObject({shallowField: {deepField: {oldField: null}}});
      io.shallowField.deepField.newField = 'this will not work!';
    }).toThrow();
  });

  testDevAndProd(
    'should create object with same structure when set with {}',
    function() {
      var beforeIO =
        new ImmutableObject({shallowField: {deepField: {oldField: null}}});
      var afterIO = ImmutableObject.set(beforeIO, {});
      expect(afterIO).toEqual(beforeIO);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  testDevAndProd(
    'should create distinct object with shallow field insertion',
    function() {
      if (window.callPhantom) return;
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

      var beforeIO = new ImmutableObject(beforeStructure);
      var afterIO = ImmutableObject.set(beforeIO, delta);
      expect(afterIO).toEqual(expectedAfterStructure);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  testDevAndProd(
    'should create distinct object with shallow field mutation',
      function() {
      if (window.callPhantom) return;
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

      var beforeIO = new ImmutableObject(beforeStructure);
      var afterIO = ImmutableObject.set(beforeIO, delta);
      expect(afterIO).toEqual(expectedAfterStructure);
      expect(afterIO).not.toBe(beforeIO);
    }
  );

  message = 'should create distinct object with deep field insertion';
  testDevAndProd(message, function() {
    if (window.callPhantom) return;
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

    // ImmutableObject does not yet support deep merging with
    // ImmutableObject.set().
    var expectedAfterStructure = {
      oldShallowField: {newDeepField: 'hello'}
    };

    var beforeIO = new ImmutableObject(beforeStructure);
    var afterIO = ImmutableObject.set(beforeIO, delta);
    expect(afterIO).toEqual(expectedAfterStructure);
    expect(afterIO).not.toBe(beforeIO);
  });

  message =
    'should tolerate arrays at deeper levels and prevent mutation on them';
  testDev(message, function() {
    if (window.callPhantom) {
      // PhantomJS has a bug with Object.freeze and Arrays.
      // https://github.com/ariya/phantomjs/issues/10817
      return;
    }
    var beforeStructure = {
      shallowField: [1,'second field',3]
    };
    var io = new ImmutableObject(beforeStructure);
    expect(function() {
      io.newField = 'nope!';
    }).toThrow();
    expect(function() {
      io.shallowField[0] = 'nope!';
    }).toThrow();
    expect(io.shallowField[1]).toEqual('second field');
  });

  message = 'should provide a setProperty interface as sugar for set()';
  testDevAndProd(message, function() {
    if (window.callPhantom) return;
    var beforeIO = new ImmutableObject({initialField: null});
    var afterIO =
      ImmutableObject.setProperty(beforeIO, 'anotherField', 'anotherValue');
    expect(afterIO).toEqual({
      initialField: null,
      anotherField: 'anotherValue'
    });
    expect(afterIO).not.toBe(beforeIO);
  });

  message = 'should recursively create distinct objects when deep copying';
  testDevAndProd(message, function() {
    if (window.callPhantom) return;
    var beforeIO = new ImmutableObject({
      a: {b: 'b', c: {}, d: 'd', e: new ImmutableObject({f: 'f'}) }
    });
    var afterIO = ImmutableObject.setDeep(beforeIO, {
      a: {b: {}, c: 'C', e: {f: 'F', g: 'G'}, h: 'H'}
    });
    expect(afterIO).toEqual({
      a: {b: {}, c: 'C', d: 'd', e: {f: 'F', g: 'G'}, h: 'H'}
    });
    expect(afterIO).not.toBe(beforeIO);
    expect(afterIO.a).not.toBe(beforeIO.a);
    expect(afterIO.a.e).not.toBe(beforeIO.a.e);
  });

  testDevAndProd('should deep copy member immutability', function() {
    if (window.callPhantom) return;
    var beforeIO = new ImmutableObject({
      a: {b: new ImmutableObject({c: 'c'}), e: {f: 'f'}}
    });
    var afterIO = ImmutableObject.setDeep(beforeIO, {
      a: {b: {d: 'D'}, e: new ImmutableObject({g: 'G'})}
    });
    expect(afterIO).toEqual({
      a: {b: {c: 'c', d: 'D'}, e: {f: 'f', g: 'G'}}
    });
    expect(afterIO instanceof Immutable).toBe(true);
    expect(afterIO.a.b instanceof Immutable).toBe(true);
    expect(afterIO.a.e instanceof Immutable).toBe(true);
  });
});

