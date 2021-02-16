/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */
import isValidElementType from 'shared/isValidElementType';
import getComponentName from 'shared/getComponentName';
import checkPropTypes from 'shared/checkPropTypes';
import {
  getIteratorFn,
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_ELEMENT_TYPE,
} from 'shared/ReactSymbols';
import {warnAboutSpreadingKeyToJSX} from 'shared/ReactFeatureFlags';

import {jsxDEV} from './ReactJSXElement';

import {describeUnknownElementTypeFrameInDEV} from 'shared/ReactComponentStackFrame';

import ReactSharedInternals from 'shared/ReactSharedInternals';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  if (__DEV__) {
    if (element) {
      const owner = element._owner;
      const stack = describeUnknownElementTypeFrameInDEV(
        element.type,
        element._source,
        owner ? owner.type : null,
      );
      ReactDebugCurrentFrame.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame.setExtraStackFrame(null);
    }
  }
}

let propTypesMisspellWarningShown;

if (__DEV__) {
  propTypesMisspellWarningShown = false;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
export function isValidElement(object) {
  if (__DEV__) {
    return (
      typeof object === 'object' &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE
    );
  }
}

function getDeclarationErrorAddendum() {
  if (__DEV__) {
    if (ReactCurrentOwner.current) {
      const name = getComponentName(ReactCurrentOwner.current.type);
      if (name) {
        return '\n\nCheck the render method of `' + name + '`.';
      }
    }
    return '';
  }
}

function getSourceInfoErrorAddendum(source) {
  if (__DEV__) {
    if (source !== undefined) {
      const fileName = source.fileName.replace(/^.*[\\\/]/, '');
      const lineNumber = source.lineNumber;
      return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
    }
    return '';
  }
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
const ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  if (__DEV__) {
    let info = getDeclarationErrorAddendum();

    if (!info) {
      const parentName =
        typeof parentType === 'string'
          ? parentType
          : parentType.displayName || parentType.name;
      if (parentName) {
        info = `\n\nCheck the top-level render call using <${parentName}>.`;
      }
    }
    return info;
  }
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (__DEV__) {
    if (!element._store || element._store.validated || element.key != null) {
      return;
    }
    element._store.validated = true;

    const currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }
    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

    // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.
    let childOwner = '';
    if (
      element &&
      element._owner &&
      element._owner !== ReactCurrentOwner.current
    ) {
      // Give the component that originally created this child.
      childOwner = ` It was passed a child from ${getComponentName(
        element._owner.type,
      )}.`;
    }

    setCurrentlyValidatingElement(element);
    console.error(
      'Each child in a list should have a unique "key" prop.' +
        '%s%s See https://reactjs.org/link/warning-keys for more information.',
      currentComponentErrorInfo,
      childOwner,
    );
    setCurrentlyValidatingElement(null);
  }
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
  if (__DEV__) {
    if (typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const child = node[i];
        if (isValidElement(child)) {
          validateExplicitKey(child, parentType);
        }
      }
    } else if (isValidElement(node)) {
      // This element was passed in a valid location.
      if (node._store) {
        node._store.validated = true;
      }
    } else if (node) {
      const iteratorFn = getIteratorFn(node);
      if (typeof iteratorFn === 'function') {
        // Entry iterators used to provide implicit keys,
        // but now we print a separate warning for them later.
        if (iteratorFn !== node.entries) {
          const iterator = iteratorFn.call(node);
          let step;
          while (!(step = iterator.next()).done) {
            if (isValidElement(step.value)) {
              validateExplicitKey(step.value, parentType);
            }
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
  if (__DEV__) {
    const type = element.type;
    if (type === null || type === undefined || typeof type === 'string') {
      return;
    }
    let propTypes;
    if (typeof type === 'function') {
      propTypes = type.propTypes;
    } else if (
      typeof type === 'object' &&
      (type.$$typeof === REACT_FORWARD_REF_TYPE ||
        // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        type.$$typeof === REACT_MEMO_TYPE)
    ) {
      propTypes = type.propTypes;
    } else {
      return;
    }
    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      const name = getComponentName(type);
      checkPropTypes(propTypes, element.props, 'prop', name, element);
    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
      propTypesMisspellWarningShown = true;
      // Intentionally inside to avoid triggering lazy initializers:
      const name = getComponentName(type);
      console.error(
        'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?',
        name || 'Unknown',
      );
    }
    if (
      typeof type.getDefaultProps === 'function' &&
      !type.getDefaultProps.isReactClassApproved
    ) {
      console.error(
        'getDefaultProps is only used on classic React.createClass ' +
          'definitions. Use a static property named `defaultProps` instead.',
      );
    }
  }
}

/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */
function validateFragmentProps(fragment) {
  if (__DEV__) {
    const keys = Object.keys(fragment.props);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== 'children' && key !== 'key') {
        setCurrentlyValidatingElement(fragment);
        console.error(
          'Invalid prop `%s` supplied to `React.Fragment`. ' +
            'React.Fragment can only have `key` and `children` props.',
          key,
        );
        setCurrentlyValidatingElement(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement(fragment);
      console.error('Invalid attribute `ref` supplied to `React.Fragment`.');
      setCurrentlyValidatingElement(null);
    }
  }
}

export function jsxWithValidation(
  type,
  props,
  key,
  isStaticChildren,
  source,
  self,
) {
  if (__DEV__) {
    const validType = isValidElementType(type);

    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
      let info = '';
      if (
        type === undefined ||
        (typeof type === 'object' &&
          type !== null &&
          Object.keys(type).length === 0)
      ) {
        info +=
          ' You likely forgot to export your component from the file ' +
          "it's defined in, or you might have mixed up default and named imports.";
      }

      const sourceInfo = getSourceInfoErrorAddendum(source);
      if (sourceInfo) {
        info += sourceInfo;
      } else {
        info += getDeclarationErrorAddendum();
      }

      let typeString;
      if (type === null) {
        typeString = 'null';
      } else if (Array.isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = `<${getComponentName(type.type) || 'Unknown'} />`;
        info =
          ' Did you accidentally export a JSX literal instead of a component?';
      } else {
        typeString = typeof type;
      }

      console.error(
        'React.jsx: type is invalid -- expected a string (for ' +
          'built-in components) or a class/function (for composite ' +
          'components) but got: %s.%s',
        typeString,
        info,
      );
    }

    const element = jsxDEV(type, props, key, source, self);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)

    if (validType) {
      const children = props.children;
      if (children !== undefined) {
        if (isStaticChildren) {
          if (Array.isArray(children)) {
            for (let i = 0; i < children.length; i++) {
              validateChildKeys(children[i], type);
            }

            if (Object.freeze) {
              Object.freeze(children);
            }
          } else {
            console.error(
              'React.jsx: Static children should always be an array. ' +
                'You are likely explicitly calling React.jsxs or React.jsxDEV. ' +
                'Use the Babel transform instead.',
            );
          }
        } else {
          validateChildKeys(children, type);
        }
      }
    }

    if (warnAboutSpreadingKeyToJSX) {
      if (hasOwnProperty.call(props, 'key')) {
        console.error(
          'React.jsx: Spreading a key to JSX is a deprecated pattern. ' +
            'Explicitly pass a key after spreading props in your JSX call. ' +
            'E.g. <%s {...props} key={key} />',
          getComponentName(type) || 'ComponentName',
        );
      }
    }

    if (type === REACT_FRAGMENT_TYPE) {
      validateFragmentProps(element);
    } else {
      validatePropTypes(element);
    }

    return element;
  }
}

// These two functions exist to still get child warnings in dev
// even with the prod transform. This means that jsxDEV is purely
// opt-in behavior for better messages but that we won't stop
// giving you warnings if you use production apis.
export function jsxWithValidationStatic(type, props, key) {
  if (__DEV__) {
    return jsxWithValidation(type, props, key, true);
  }
}

export function jsxWithValidationDynamic(type, props, key) {
  if (__DEV__) {
    return jsxWithValidation(type, props, key, false);
  }
}
