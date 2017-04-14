/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElementValidator
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');

var canDefineProperty = require('canDefineProperty');
var getComponentName = require('getComponentName');
var getIteratorFn = require('getIteratorFn');
var validateExplicitKey = require('validateExplicitKey');

if (__DEV__) {
  var checkPropTypes = require('checkPropTypes');
  var warning = require('fbjs/lib/warning');
  var ReactDebugCurrentFrame = require('ReactDebugCurrentFrame');
  var {
    getCurrentStackAddendum,
  } = require('ReactComponentTreeHook');
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = getComponentName(ReactCurrentOwner.current);
    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }
  return '';
}

function getSourceInfoErrorAddendum(elementProps) {
  if (
    elementProps !== null &&
    elementProps !== undefined &&
    elementProps.__source !== undefined
  ) {
    var source = elementProps.__source;
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
  }
  return '';
}

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string'
      ? parentType
      : parentType.displayName || parentType.name;
    if (parentName) {
      info = `\n\nCheck the top-level render call using <${parentName}>.`;
    }
  }
  return info;
}

/**
 * Composes the warning that is shown when an element doesn't have an explicit
 * key assigned to it.
 *
 * @internal
 * @param {*} parentType element's parent's type.
 * @param {ReactElement} element Element that requires a key.
 * @return string message that described explicit key error
 */
function getExplicitKeyErrorMessage(parentType, element) {
  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (
    element && element._owner && element._owner !== ReactCurrentOwner.current
  ) {
    // Give the component that originally created this child.
    childOwner = ` It was passed a child from ${getComponentName(element._owner)}.`;
  }

  const message = 'Each child in an array or iterator should have a unique "key" prop.' +
    currentComponentErrorInfo +
    childOwner +
    ' ' +
    'See https://fb.me/react-warning-keys for more information.';
  return message;
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        const getMainExplicitKeyErrorMessage = getExplicitKeyErrorMessage.bind(
          null,
          parentType,
        );
        validateExplicitKey(
          child,
          getMainExplicitKeyErrorMessage,
          getCurrentStackAddendum,
        );
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);
    // Entry iterators provide implicit keys.
    if (iteratorFn) {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            const getMainExplicitKeyErrorMessage = getExplicitKeyErrorMessage.bind(
              null,
              parentType,
            );
            validateExplicitKey(
              step.value,
              getMainExplicitKeyErrorMessage,
              getCurrentStackAddendum,
            );
          }
        }
      }
    }
  }
}

/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
  var componentClass = element.type;
  if (typeof componentClass !== 'function') {
    return;
  }
  var name = componentClass.displayName || componentClass.name;

  // ReactNative `View.propTypes` have been deprecated in favor of `ViewPropTypes`.
  // In their place a temporary getter has been added with a deprecated warning message.
  // Avoid triggering that warning during validation using the temporary workaround,
  // __propTypesSecretDontUseThesePlease.
  // TODO (bvaughn) Revert this particular change any time after April 1 ReactNative tag.
  var propTypes = typeof componentClass.__propTypesSecretDontUseThesePlease ===
    'object'
    ? componentClass.__propTypesSecretDontUseThesePlease
    : componentClass.propTypes;

  if (propTypes) {
    checkPropTypes(
      propTypes,
      element.props,
      'prop',
      name,
      ReactDebugCurrentFrame.getStackAddendum,
    );
  }
  if (typeof componentClass.getDefaultProps === 'function') {
    warning(
      componentClass.getDefaultProps.isReactClassApproved,
      'getDefaultProps is only used on classic React.createClass ' +
        'definitions. Use a static property named `defaultProps` instead.',
    );
  }
}

var ReactElementValidator = {
  createElement: function(type, props, children) {
    var validType = typeof type === 'string' || typeof type === 'function';
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
      var info = '';
      if (
        type === undefined ||
        (typeof type === 'object' &&
          type !== null &&
          Object.keys(type).length === 0)
      ) {
        info += ' You likely forgot to export your component from the file ' +
          "it's defined in.";
      }

      var sourceInfo = getSourceInfoErrorAddendum(props);
      if (sourceInfo) {
        info += sourceInfo;
      } else {
        info += getDeclarationErrorAddendum();
      }

      info += getCurrentStackAddendum();

      warning(
        false,
        'React.createElement: type is invalid -- expected a string (for ' +
          'built-in components) or a class/function (for composite ' +
          'components) but got: %s.%s',
        type == null ? type : typeof type,
        info,
      );
    }

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    if (__DEV__) {
      ReactDebugCurrentFrame.element = element;
    }

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)
    if (validType) {
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }

    validatePropTypes(element);

    if (__DEV__) {
      ReactDebugCurrentFrame.element = null;
    }

    return element;
  },

  createFactory: function(type) {
    var validatedFactory = ReactElementValidator.createElement.bind(null, type);
    // Legacy hook TODO: Warn if this is accessed
    validatedFactory.type = type;

    if (__DEV__) {
      if (canDefineProperty) {
        Object.defineProperty(validatedFactory, 'type', {
          enumerable: false,
          get: function() {
            warning(
              false,
              'Factory.type is deprecated. Access the class directly ' +
                'before passing it to createFactory.',
            );
            Object.defineProperty(this, 'type', {
              value: type,
            });
            return type;
          },
        });
      }
    }

    return validatedFactory;
  },

  cloneElement: function(element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    if (__DEV__) {
      ReactDebugCurrentFrame.element = newElement;
    }
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    if (__DEV__) {
      ReactDebugCurrentFrame.element = null;
    }
    return newElement;
  },
};

module.exports = ReactElementValidator;
