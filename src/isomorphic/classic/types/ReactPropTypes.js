/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPropTypes
 */

'use strict';

var ReactElement = require('ReactElement');
var ReactPropTypesSecret = require('ReactPropTypesSecret');

var emptyFunction = require('fbjs/lib/emptyFunction');
var getIteratorFn = require('getIteratorFn');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *  var MyLink = React.createClass({
 *    propTypes: {
 *      // An optional string or URI prop named "href".
 *      href: function(props, propName, componentName) {
 *        var propValue = props[propName];
 *        if (propValue != null && typeof propValue !== 'string' &&
 *            !(propValue instanceof URI)) {
 *          return new Error(
 *            'Expected a string or an URI for ' + propName + ' in ' +
 *            componentName
 *          );
 *        }
 *      }
 *    },
 *    render: function() {...}
 *  });
 *
 * @internal
 */

var ANONYMOUS = '<<anonymous>>';

var ReactPropTypes;

if (__DEV__) {
  // Keep in sync with production version below
  ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
  };
} else {
  var productionTypeChecker = function() {
    invariant(
      false,
      'React.PropTypes type checking code is stripped in production.',
    );
  };
  productionTypeChecker.isRequired = productionTypeChecker;
  var getProductionTypeChecker = () => productionTypeChecker;
  // Keep in sync with development version above
  ReactPropTypes = {
    array: productionTypeChecker,
    bool: productionTypeChecker,
    func: productionTypeChecker,
    number: productionTypeChecker,
    object: productionTypeChecker,
    string: productionTypeChecker,
    symbol: productionTypeChecker,

    any: productionTypeChecker,
    arrayOf: getProductionTypeChecker,
    element: productionTypeChecker,
    instanceOf: getProductionTypeChecker,
    node: productionTypeChecker,
    objectOf: getProductionTypeChecker,
    oneOf: getProductionTypeChecker,
    oneOfType: getProductionTypeChecker,
    shape: getProductionTypeChecker,
  };
}

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
/*eslint-disable no-self-compare*/
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}
/*eslint-enable no-self-compare*/

/**
 * We use an Error-like object for backward compatibility as people may call
 * PropTypes directly and inspect their output. However, we don't use real
 * Errors anymore. We don't inspect their stack anyway, and creating them
 * is prohibitively expensive if they are created too often, such as what
 * happens in oneOfType() for any type before the one that matched.
 */
function PropTypeError(message) {
  this.message = message;
  this.stack = '';
}
// Make `instanceof Error` still work for returned errors.
PropTypeError.prototype = Error.prototype;

function createChainableTypeChecker(validate) {
  if (__DEV__) {
    var manualPropTypeCallCache = {};
  }
  function checkType(
    isRequired,
    props,
    propName,
    componentName,
    location,
    propFullName,
    secret,
  ) {
    componentName = componentName || ANONYMOUS;
    propFullName = propFullName || propName;
    if (__DEV__) {
      if (secret !== ReactPropTypesSecret && typeof console !== 'undefined') {
        var cacheKey = `${componentName}:${propName}`;
        if (!manualPropTypeCallCache[cacheKey]) {
          warning(
            false,
            'You are manually calling a React.PropTypes validation ' +
              'function for the `%s` prop on `%s`. This is deprecated ' +
              'and will not work in production with the next major version. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' +
              'for details.',
            propFullName,
            componentName,
          );
          manualPropTypeCallCache[cacheKey] = true;
        }
      }
    }
    if (props[propName] == null) {
      if (isRequired) {
        if (props[propName] === null) {
          return new PropTypeError(
            `The ${location} \`${propFullName}\` is marked as required ` +
              `in \`${componentName}\`, but its value is \`null\`.`,
          );
        }
        return new PropTypeError(
          `The ${location} \`${propFullName}\` is marked as required in ` +
            `\`${componentName}\`, but its value is \`undefined\`.`,
        );
      }
      return null;
    } else {
      return validate(props, propName, componentName, location, propFullName);
    }
  }

  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createPrimitiveTypeChecker(expectedType) {
  function validate(
    props,
    propName,
    componentName,
    location,
    propFullName,
    secret,
  ) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== expectedType) {
      // `propValue` being instance of, say, date/regexp, pass the 'object'
      // check, but we can offer a more precise error message here rather than
      // 'of type `object`'.
      var preciseType = getPreciseType(propValue);

      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type ` +
          `\`${preciseType}\` supplied to \`${componentName}\`, expected ` +
          `\`${expectedType}\`.`,
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createAnyTypeChecker() {
  return createChainableTypeChecker(emptyFunction.thatReturnsNull);
}

function createArrayOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location, propFullName) {
    if (typeof typeChecker !== 'function') {
      return new PropTypeError(
        `Property \`${propFullName}\` of component \`${componentName}\` has invalid PropType notation inside arrayOf.`,
      );
    }
    var propValue = props[propName];
    if (!Array.isArray(propValue)) {
      var propType = getPropType(propValue);
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type ` +
          `\`${propType}\` supplied to \`${componentName}\`, expected an array.`,
      );
    }
    for (var i = 0; i < propValue.length; i++) {
      var error = typeChecker(
        propValue,
        i,
        componentName,
        location,
        `${propFullName}[${i}]`,
        ReactPropTypesSecret,
      );
      if (error instanceof Error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createElementTypeChecker() {
  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    if (!ReactElement.isValidElement(propValue)) {
      var propType = getPropType(propValue);
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type ` +
          `\`${propType}\` supplied to \`${componentName}\`, expected a single ReactElement.`,
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createInstanceTypeChecker(expectedClass) {
  function validate(props, propName, componentName, location, propFullName) {
    if (!(props[propName] instanceof expectedClass)) {
      var expectedClassName = expectedClass.name || ANONYMOUS;
      var actualClassName = getClassName(props[propName]);
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type ` +
          `\`${actualClassName}\` supplied to \`${componentName}\`, expected ` +
          `instance of \`${expectedClassName}\`.`,
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createEnumTypeChecker(expectedValues) {
  if (!Array.isArray(expectedValues)) {
    warning(
      false,
      'Invalid argument supplied to oneOf, expected an instance of array.',
    );
    return emptyFunction.thatReturnsNull;
  }

  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    for (var i = 0; i < expectedValues.length; i++) {
      if (is(propValue, expectedValues[i])) {
        return null;
      }
    }

    var valuesString = JSON.stringify(expectedValues);
    return new PropTypeError(
      `Invalid ${location} \`${propFullName}\` of value \`${propValue}\` ` +
        `supplied to \`${componentName}\`, expected one of ${valuesString}.`,
    );
  }
  return createChainableTypeChecker(validate);
}

function createObjectOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location, propFullName) {
    if (typeof typeChecker !== 'function') {
      return new PropTypeError(
        `Property \`${propFullName}\` of component \`${componentName}\` has invalid PropType notation inside objectOf.`,
      );
    }
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type ` +
          `\`${propType}\` supplied to \`${componentName}\`, expected an object.`,
      );
    }
    for (var key in propValue) {
      if (propValue.hasOwnProperty(key)) {
        var error = typeChecker(
          propValue,
          key,
          componentName,
          location,
          `${propFullName}.${key}`,
          ReactPropTypesSecret,
        );
        if (error instanceof Error) {
          return error;
        }
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createUnionTypeChecker(arrayOfTypeCheckers) {
  if (!Array.isArray(arrayOfTypeCheckers)) {
    warning(
      false,
      'Invalid argument supplied to oneOfType, expected an instance of array.',
    );
    return emptyFunction.thatReturnsNull;
  }

  function validate(props, propName, componentName, location, propFullName) {
    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (
        checker(
          props,
          propName,
          componentName,
          location,
          propFullName,
          ReactPropTypesSecret,
        ) == null
      ) {
        return null;
      }
    }

    return new PropTypeError(
      `Invalid ${location} \`${propFullName}\` supplied to ` +
        `\`${componentName}\`.`,
    );
  }
  return createChainableTypeChecker(validate);
}

function createNodeChecker() {
  function validate(props, propName, componentName, location, propFullName) {
    if (!isNode(props[propName])) {
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` supplied to ` +
          `\`${componentName}\`, expected a ReactNode.`,
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createShapeTypeChecker(shapeTypes) {
  function validate(props, propName, componentName, location, propFullName) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      return new PropTypeError(
        `Invalid ${location} \`${propFullName}\` of type \`${propType}\` ` +
          `supplied to \`${componentName}\`, expected \`object\`.`,
      );
    }
    for (var key in shapeTypes) {
      var checker = shapeTypes[key];
      if (!checker) {
        continue;
      }
      var error = checker(
        propValue,
        key,
        componentName,
        location,
        `${propFullName}.${key}`,
        ReactPropTypesSecret,
      );
      if (error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function isNode(propValue) {
  switch (typeof propValue) {
    case 'number':
    case 'string':
    case 'undefined':
      return true;
    case 'boolean':
      return !propValue;
    case 'object':
      if (Array.isArray(propValue)) {
        return propValue.every(isNode);
      }
      if (propValue === null || ReactElement.isValidElement(propValue)) {
        return true;
      }

      var iteratorFn = getIteratorFn(propValue);
      if (iteratorFn) {
        var iterator = iteratorFn.call(propValue);
        var step;
        if (iteratorFn !== propValue.entries) {
          while (!(step = iterator.next()).done) {
            if (!isNode(step.value)) {
              return false;
            }
          }
        } else {
          // Iterator will provide entry [k,v] tuples rather than values.
          while (!(step = iterator.next()).done) {
            var entry = step.value;
            if (entry) {
              if (!isNode(entry[1])) {
                return false;
              }
            }
          }
        }
      } else {
        return false;
      }

      return true;
    default:
      return false;
  }
}

function isSymbol(propType, propValue) {
  // Native Symbol.
  if (propType === 'symbol') {
    return true;
  }

  // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
  if (propValue['@@toStringTag'] === 'Symbol') {
    return true;
  }

  // Fallback for non-spec compliant Symbols which are polyfilled.
  if (typeof Symbol === 'function' && propValue instanceof Symbol) {
    return true;
  }

  return false;
}

// Equivalent of `typeof` but with special handling for array and regexp.
function getPropType(propValue) {
  var propType = typeof propValue;
  if (Array.isArray(propValue)) {
    return 'array';
  }
  if (propValue instanceof RegExp) {
    // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
    // passes PropTypes.object.
    return 'object';
  }
  if (isSymbol(propType, propValue)) {
    return 'symbol';
  }
  return propType;
}

// This handles more types than `getPropType`. Only used for error messages.
// See `createPrimitiveTypeChecker`.
function getPreciseType(propValue) {
  var propType = getPropType(propValue);
  if (propType === 'object') {
    if (propValue instanceof Date) {
      return 'date';
    } else if (propValue instanceof RegExp) {
      return 'regexp';
    }
  }
  return propType;
}

// Returns class name of the object, if any.
function getClassName(propValue) {
  if (!propValue.constructor || !propValue.constructor.name) {
    return ANONYMOUS;
  }
  return propValue.constructor.name;
}

module.exports = ReactPropTypes;
