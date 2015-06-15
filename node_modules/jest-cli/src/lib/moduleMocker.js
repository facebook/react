/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
// This module uses the Function constructor, so it can't currently run
// in strict mode
/* jshint strict:false */

function isA(typeName, value) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
}

function getType(ref) {
  if (isA('RegExp', ref)) {
    return 'regexp';
  }

  if (isA('Array', ref)) {
    return 'array';
  }

  if (isA('Function', ref)) {
    return 'function';
  }

  if (isA('Object', ref)) {
    return 'object';
  }

  // consider number and string fields to be constants that we want to
  // pick up as they are
  if (isA('Number', ref) || isA('String', ref)) {
    return 'constant';
  }

  if (ref === undefined) {
    return 'undefined';
  }

  if (ref === null) {
    return 'null';
  }

  return null;
}

/**
 * methods on ES6 classes are not enumerable, so they can't be found with a
 * simple `for (var slot in ...) {` so that had to be replaced with getSlots()
 */
function getSlots(object) {
  var slots = {};
  if (!object) {
    return [];
  }
  // Simply attempting to access any of these throws an error.
  var forbiddenProps = [ 'caller', 'callee', 'arguments' ];
  var collectProp = function(prop) {
    var propDesc = Object.getOwnPropertyDescriptor(object, prop);
    if (forbiddenProps.indexOf(prop) === -1 &&
        // Include only enumerable accessors.
        (propDesc.enumerable || !propDesc.get)) {
      slots[prop] = true;
    }
  };
  do {
    Object.getOwnPropertyNames(object).forEach(collectProp);
    object = Object.getPrototypeOf(object);
  } while (object && Object.getPrototypeOf(object) !== null);
  return Object.keys(slots);
}

function makeComponent(metadata) {
  switch (metadata.type) {
    case 'object':
      return {};

    case 'array':
      return [];

    case 'regexp':
      return new RegExp();

    case 'constant':
    case 'null':
    case 'undefined':
      return metadata.value;

    case 'function':
      var defaultReturnValue;
      var specificReturnValues = [];
      var mockImpl;
      var isReturnValueLastSet = false;
      var calls = [];
      var instances = [];
      var prototype =
        (metadata.members && metadata.members.prototype &&
          metadata.members.prototype.members) || {};

      var mockConstructor = function() {
        instances.push(this);
        calls.push(Array.prototype.slice.call(arguments));
        if (this instanceof f) {
          // This is probably being called as a constructor
          getSlots(prototype).forEach(function(slot) {
            // Copy prototype methods to the instance to make
            // it easier to interact with mock instance call and
            // return values
            if (prototype[slot].type === 'function') {
              var protoImpl = this[slot];
              this[slot] = generateFromMetadata(prototype[slot]);
              this[slot]._protoImpl = protoImpl;
            }
          }, this);

          // Run the mock constructor implementation
          return mockImpl && mockImpl.apply(this, arguments);
        }

        var returnValue;
        // If return value is last set, either specific or default, i.e.
        // mockReturnValueOnce()/mockReturnValue() is called and no
        // mockImplementation() is called after that.
        // use the set return value.
        if (isReturnValueLastSet) {
          returnValue = specificReturnValues.shift();
          if (returnValue === undefined) {
            returnValue = defaultReturnValue;
          }
        }

        // If mockImplementation() is last set, or specific return values
        // are used up, use the mock implementation.
        if (mockImpl && returnValue === undefined) {
          return mockImpl.apply(this, arguments);
        }

        // Otherwise use prototype implementation
        if (returnValue === undefined && f._protoImpl) {
          return f._protoImpl.apply(this, arguments);
        }

        return returnValue;
      };

      // Preserve `name` property of mocked function.
      /* jshint evil:true */
      var f = new Function(
        'mockConstructor',
        'return function ' + metadata.name + '(){' +
          'return mockConstructor.apply(this,arguments);' +
        '}'
      )(mockConstructor);

      f._isMockFunction = true;

      f.mock = {
        calls: calls,
        instances: instances
      };

      f.mockClear = function() {
        calls.length = 0;
        instances.length = 0;
      };

      f.mockReturnValueOnce = function(value) {
        // next function call will return this value or default return value
        isReturnValueLastSet = true;
        specificReturnValues.push(value);
        return f;
      };

      f.mockReturnValue = function(value) {
        // next function call will return specified return value or this one
        isReturnValueLastSet = true;
        defaultReturnValue = value;
        return f;
      };

      f.mockImplementation = f.mockImpl = function(fn) {
        // next function call will use mock implementation return value
        isReturnValueLastSet = false;
        mockImpl = fn;
        return f;
      };

      f.mockReturnThis = function() {
        return f.mockImplementation(function() {
          return this;
        });
      };

      f._getMockImplementation = function() {
        return mockImpl;
      };

      if (metadata.mockImpl) {
        f.mockImplementation(metadata.mockImpl);
      }

      return f;
  }

  throw new Error('Unrecognized type ' + metadata.type);
}

function generateFromMetadata(_metadata) {
  var callbacks = [];
  var refs = {};

  function generateMock(metadata) {
    var mock = makeComponent(metadata);
    if (metadata.refID !== null && metadata.refID !== undefined) {
      refs[metadata.refID] = mock;
    }

    function getRefCallback(slot, ref) {
      return function() {
        mock[slot] = refs[ref];
      };
    }

    if (metadata.__TCmeta) {
      mock.__TCmeta = metadata.__TCmeta;
    }

    getSlots(metadata.members).forEach(function(slot) {
      var slotMetadata = metadata.members[slot];
      if (slotMetadata.ref !== null && slotMetadata.ref !== undefined) {
        callbacks.push(getRefCallback(slot, slotMetadata.ref));
      } else {
        mock[slot] = generateMock(slotMetadata);
      }
    });

    if (metadata.type !== 'undefined'
        && metadata.type !== 'null'
        && mock.prototype) {
      mock.prototype.constructor = mock;
    }

    return mock;
  }

  var mock = generateMock(_metadata);
  callbacks.forEach(function(setter) {
    setter();
  });

  return mock;
}

function _getMetadata(component, _refs) {
  var refs = _refs || [];

  // This is a potential performance drain, since the whole list is scanned
  // for every component
  var ref = refs.indexOf(component);
  if (ref > -1) {
    return {ref: ref};
  }

  var type = getType(component);
  if (!type) {
    return null;
  }

  var metadata = {type : type};
  if (type === 'constant'
      || type === 'undefined'
      || type === 'null') {
    metadata.value = component;
    return metadata;
  } else if (type === 'function') {
    metadata.name = component.name;
    metadata.__TCmeta = component.__TCmeta;
    if (component._isMockFunction) {
      metadata.mockImpl = component._getMockImplementation();
    }
  }

  metadata.refID = refs.length;
  refs.push(component);

  var members = null;

  function addMember(slot, data) {
    if (!data) {
      return;
    }
    if (!members) {
      members = {};
    }
    members[slot] = data;
  }

  // Leave arrays alone
  if (type !== 'array') {
    if (type !== 'undefined') {
      getSlots(component).forEach(function(slot) {
        if (slot.charAt(0) === '_' ||
            (type === 'function' && component._isMockFunction &&
             slot.match(/^mock/))) {
          return;
        }

        if (!component.hasOwnProperty && component[slot] !== undefined ||
            component.hasOwnProperty(slot) ||
            /* jshint eqeqeq:false */
            (type === 'object' && component[slot] != Object.prototype[slot])) {
          addMember(slot, _getMetadata(component[slot], refs));
        }
      });
    }

    // If component is native code function, prototype might be undefined
    if (type === 'function' && component.prototype) {
      var prototype = _getMetadata(component.prototype, refs);
      if (prototype && prototype.members) {
        addMember('prototype', prototype);
      }
    }
  }

  if (members) {
    metadata.members = members;
  }

  return metadata;
}

function removeUnusedRefs(metadata) {
  function visit(metadata, f) {
    f(metadata);
    if (metadata.members) {
      getSlots(metadata.members).forEach(function(slot) {
        visit(metadata.members[slot], f);
      });
    }
  }

  var usedRefs = {};
  visit(metadata, function(metadata) {
    if (metadata.ref !== null && metadata.ref !== undefined) {
      usedRefs[metadata.ref] = true;
    }
  });

  visit(metadata, function(metadata) {
    if (!usedRefs[metadata.refID]) {
      delete metadata.refID;
    }
  });
}

module.exports = {
  /**
   * Generates a mock based on the given metadata. Mocks treat functions
   * specially, and all mock functions have additional members, described in the
   * documentation for getMockFunction in this module.
   *
   * One important note: function prototoypes are handled specially by this
   * mocking framework. For functions with prototypes, when called as a
   * constructor, the mock will install mocked function members on the instance.
   * This allows different instances of the same constructor to have different
   * values for its mocks member and its return values.
   *
   * @param metadata Metadata for the mock in the schema returned by the
   * getMetadata method of this module.
   *
   */
  generateFromMetadata: generateFromMetadata,

  /**
   * Inspects the argument and returns its schema in the following recursive
   * format:
   * {
   *  type: ...
   *  members : {}
   * }
   *
   * Where type is one of 'array', 'object', 'function', or 'ref', and members
   * is an optional dictionary where the keys are member names and the values
   * are metadata objects. Function prototypes are defined simply by defining
   * metadata for the member.prototype of the function. The type of a function
   * prototype should always be "object". For instance, a simple class might be
   * defined like this:
   *
   * {
   *  type: 'function',
   *  members: {
   *    staticMethod: {type: 'function'},
   *    prototype: {
   *      type: 'object',
   *      members: {
   *        instanceMethod: {type: 'function'}
   *      }
   *    }
   *  }
   * }
   *
   * Metadata may also contain references to other objects defined within the
   * same metadata object. The metadata for the referent must be marked with
   * 'refID' key and an arbitrary value. The referer must be marked with a
   * 'ref' key that has the same value as object with refID that it refers to.
   * For instance, this metadata blob:
   * {
   *  type: 'object',
   *  refID: 1,
   *  members: {
   *    self: {ref: 1}
   *  }
   * }
   *
   * defines an object with a slot named 'self' that refers back to the object.
   *
   * @param component The component for which to retrieve metadata.
   */
  getMetadata: function(component) {
    var metadata = _getMetadata(component);
    // to make it easier to work with mock metadata, only preserve references
    // that are actually used
    if (metadata !== null) {
      removeUnusedRefs(metadata);
    }
    return metadata;
  },

  /**
   * Generates a stand-alone function with members that help drive unit tests or
   * confirm expectations. Specifically, functions returned by this method have
   * the following members:
   *
   * .mock:
   * An object with two members, "calls", and "instances", which are both
   * lists. The items in the "calls" list are the arguments with which the
   * function was called. The "instances" list stores the value of 'this' for
   * each call to the function. This is useful for retrieving instances from a
   * constructor.
   *
   * .mockReturnValueOnce(value)
   * Pushes the given value onto a FIFO queue of return values for the
   * function.
   *
   * .mockReturnValue(value)
   * Sets the default return value for the function.
   *
   * .mockImplementation(function)
   * Sets a mock implementation for the function.
   *
   * .mockReturnThis()
   * Syntactic sugar for .mockImplementation(function() {return this;})
   *
   * In case both mockImplementation() and
   * mockReturnValueOnce()/mockReturnValue() are called. The priority of
   * which to use is based on what is the last call:
   * - if the last call is mockReturnValueOnce() or mockReturnValue(),
   *   use the specific return specific return value or default return value.
   *   If specific return values are used up or no default return value is set,
   *   fall back to try mockImplementation();
   * - if the last call is mockImplementation(), run the given implementation
   *   and return the result.
   */
  getMockFunction: function() {
    return makeComponent({type: 'function'});
  },

  // Just a short-hand alias
  getMockFn: function() {
    return this.getMockFunction();
  }
};
