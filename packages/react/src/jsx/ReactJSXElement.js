/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getComponentNameFromType from 'shared/getComponentNameFromType';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import hasOwnProperty from 'shared/hasOwnProperty';
import assign from 'shared/assign';
import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';
import {checkKeyStringCoercion} from 'shared/CheckStringCoercion';
import isValidElementType from 'shared/isValidElementType';
import isArray from 'shared/isArray';
import {describeUnknownElementTypeFrameInDEV} from 'shared/ReactComponentStackFrame';
import {
  enableRefAsProp,
  disableStringRefs,
  disableDefaultPropsExceptForClasses,
  enableOwnerStacks,
} from 'shared/ReactFeatureFlags';
import {checkPropStringCoercion} from 'shared/CheckStringCoercion';
import {ClassComponent} from 'react-reconciler/src/ReactWorkTags';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';

const REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference');

const createTask =
  // eslint-disable-next-line react-internal/no-production-logging
  __DEV__ && enableOwnerStacks && console.createTask
    ? // eslint-disable-next-line react-internal/no-production-logging
      console.createTask
    : () => null;

function getTaskName(type) {
  if (type === REACT_FRAGMENT_TYPE) {
    return '<>';
  }
  if (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_LAZY_TYPE
  ) {
    // We don't want to eagerly initialize the initializer in DEV mode so we can't
    // call it to extract the type so we don't know the type of this component.
    return '<...>';
  }
  try {
    const name = getComponentNameFromType(type);
    return name ? '<' + name + '>' : '<...>';
  } catch (x) {
    return '<...>';
  }
}

function getOwner() {
  if (__DEV__ || !disableStringRefs) {
    const dispatcher = ReactSharedInternals.A;
    if (dispatcher === null) {
      return null;
    }
    return dispatcher.getOwner();
  }
  return null;
}

let specialPropKeyWarningShown;
let specialPropRefWarningShown;
let didWarnAboutStringRefs;
let didWarnAboutElementRef;
let didWarnAboutOldJSXRuntime;

if (__DEV__) {
  didWarnAboutStringRefs = {};
  didWarnAboutElementRef = {};
}

const enableFastJSXWithoutStringRefs = enableRefAsProp && disableStringRefs;

function hasValidRef(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'ref')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'key')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function warnIfStringRefCannotBeAutoConverted(config, self) {
  if (__DEV__) {
    let owner;
    if (
      !disableStringRefs &&
      typeof config.ref === 'string' &&
      (owner = getOwner()) &&
      self &&
      owner.stateNode !== self
    ) {
      const componentName = getComponentNameFromType(owner.type);

      if (!didWarnAboutStringRefs[componentName]) {
        console.error(
          'Component "%s" contains the string ref "%s". ' +
            'Support for string refs will be removed in a future major release. ' +
            'This case cannot be automatically converted to an arrow function. ' +
            'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
            'Learn more about using refs safely here: ' +
            'https://react.dev/link/strict-mode-string-ref',
          getComponentNameFromType(owner.type),
          config.ref,
        );
        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

function defineKeyPropWarningGetter(props, displayName) {
  if (__DEV__) {
    const warnAboutAccessingKey = function () {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        console.error(
          '%s: `key` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://react.dev/link/special-props)',
          displayName,
        );
      }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, 'key', {
      get: warnAboutAccessingKey,
      configurable: true,
    });
  }
}

function defineRefPropWarningGetter(props, displayName) {
  if (!enableRefAsProp) {
    if (__DEV__) {
      const warnAboutAccessingRef = function () {
        if (!specialPropRefWarningShown) {
          specialPropRefWarningShown = true;
          console.error(
            '%s: `ref` is not a prop. Trying to access it will result ' +
              'in `undefined` being returned. If you need to access the same ' +
              'value within the child component, you should pass it as a different ' +
              'prop. (https://react.dev/link/special-props)',
            displayName,
          );
        }
      };
      warnAboutAccessingRef.isReactWarning = true;
      Object.defineProperty(props, 'ref', {
        get: warnAboutAccessingRef,
        configurable: true,
      });
    }
  }
}

function elementRefGetterWithDeprecationWarning() {
  if (__DEV__) {
    const componentName = getComponentNameFromType(this.type);
    if (!didWarnAboutElementRef[componentName]) {
      didWarnAboutElementRef[componentName] = true;
      console.error(
        'Accessing element.ref was removed in React 19. ref is now a ' +
          'regular prop. It will be removed from the JSX Element ' +
          'type in a future release.',
      );
    }

    // An undefined `element.ref` is coerced to `null` for
    // backwards compatibility.
    const refProp = this.props.ref;
    return refProp !== undefined ? refProp : null;
  }
}

/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.transitional.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */
function ReactElement(
  type,
  key,
  _ref,
  self,
  source,
  owner,
  props,
  debugStack,
  debugTask,
) {
  let ref;
  if (enableRefAsProp) {
    // When enableRefAsProp is on, ignore whatever was passed as the ref
    // argument and treat `props.ref` as the source of truth. The only thing we
    // use this for is `element.ref`, which will log a deprecation warning on
    // access. In the next release, we can remove `element.ref` as well as the
    // `ref` argument.
    const refProp = props.ref;

    // An undefined `element.ref` is coerced to `null` for
    // backwards compatibility.
    ref = refProp !== undefined ? refProp : null;
  } else {
    ref = _ref;
  }

  let element;
  if (__DEV__ && enableRefAsProp) {
    // In dev, make `ref` a non-enumerable property with a warning. It's non-
    // enumerable so that test matchers and serializers don't access it and
    // trigger the warning.
    //
    // `ref` will be removed from the element completely in a future release.
    element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type,
      key,

      props,

      // Record the component responsible for creating this element.
      _owner: owner,
    };
    if (ref !== null) {
      Object.defineProperty(element, 'ref', {
        enumerable: false,
        get: elementRefGetterWithDeprecationWarning,
      });
    } else {
      // Don't warn on access if a ref is not given. This reduces false
      // positives in cases where a test serializer uses
      // getOwnPropertyDescriptors to compare objects, like Jest does, which is
      // a problem because it bypasses non-enumerability.
      //
      // So unfortunately this will trigger a false positive warning in Jest
      // when the diff is printed:
      //
      //   expect(<div ref={ref} />).toEqual(<span ref={ref} />);
      //
      // A bit sketchy, but this is what we've done for the `props.key` and
      // `props.ref` accessors for years, which implies it will be good enough
      // for `element.ref`, too. Let's see if anyone complains.
      Object.defineProperty(element, 'ref', {
        enumerable: false,
        value: null,
      });
    }
  } else if (!__DEV__ && disableStringRefs) {
    // In prod, `ref` is a regular property and _owner doesn't exist.
    element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type,
      key,
      ref,

      props,
    };
  } else {
    // In prod, `ref` is a regular property. It will be removed in a
    // future release.
    element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type,
      key,
      ref,

      props,

      // Record the component responsible for creating this element.
      _owner: owner,
    };
  }

  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: 0,
    });
    // debugInfo contains Server Component debug information.
    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    if (enableOwnerStacks) {
      Object.defineProperty(element, '_debugStack', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugStack,
      });
      Object.defineProperty(element, '_debugTask', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugTask,
      });
    }
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
}

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsxProd(type, config, maybeKey) {
  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    if (__DEV__) {
      checkKeyStringCoercion(maybeKey);
    }
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    if (__DEV__) {
      checkKeyStringCoercion(config.key);
    }
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    if (!enableRefAsProp) {
      ref = config.ref;
      if (!disableStringRefs) {
        ref = coerceStringRef(ref, getOwner(), type);
      }
    }
  }

  let props;
  if (
    (enableFastJSXWithoutStringRefs ||
      (enableRefAsProp && !('ref' in config))) &&
    !('key' in config)
  ) {
    // If key was not spread in, we can reuse the original props object. This
    // only works for `jsx`, not `createElement`, because `jsx` is a compiler
    // target and the compiler always passes a new object. For `createElement`,
    // we can't assume a new object is passed every time because it can be
    // called manually.
    //
    // Spreading key is a warning in dev. In a future release, we will not
    // remove a spread key from the props object. (But we'll still warn.) We'll
    // always pass the object straight through.
    props = config;
  } else {
    // We need to remove reserved props (key, prop, ref). Create a fresh props
    // object and copy over all the non-reserved props. We don't use `delete`
    // because in V8 it will deopt the object to dictionary mode.
    props = {};
    for (const propName in config) {
      // Skip over reserved prop names
      if (propName !== 'key' && (enableRefAsProp || propName !== 'ref')) {
        if (enableRefAsProp && !disableStringRefs && propName === 'ref') {
          props.ref = coerceStringRef(config[propName], getOwner(), type);
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  if (!disableDefaultPropsExceptForClasses) {
    // Resolve default props
    if (type && type.defaultProps) {
      const defaultProps = type.defaultProps;
      for (const propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    undefined,
    undefined,
    getOwner(),
    props,
    undefined,
    undefined,
  );
}

// While `jsxDEV` should never be called when running in production, we do
// support `jsx` and `jsxs` when running in development. This supports the case
// where a third-party dependency ships code that was compiled for production;
// we want to still provide warnings in development.
//
// So these functions are the _dev_ implementations of the _production_
// API signatures.
//
// Since these functions are dev-only, it's ok to add an indirection here. They
// only exist to provide different versions of `isStaticChildren`. (We shouldn't
// use this pattern for the prod versions, though, because it will add an call
// frame.)
export function jsxProdSignatureRunningInDevWithDynamicChildren(
  type,
  config,
  maybeKey,
  source,
  self,
) {
  if (__DEV__) {
    const isStaticChildren = false;
    return jsxDEVImpl(
      type,
      config,
      maybeKey,
      isStaticChildren,
      source,
      self,
      __DEV__ && enableOwnerStacks ? Error('react-stack-top-frame') : undefined,
      __DEV__ && enableOwnerStacks ? createTask(getTaskName(type)) : undefined,
    );
  }
}

export function jsxProdSignatureRunningInDevWithStaticChildren(
  type,
  config,
  maybeKey,
  source,
  self,
) {
  if (__DEV__) {
    const isStaticChildren = true;
    return jsxDEVImpl(
      type,
      config,
      maybeKey,
      isStaticChildren,
      source,
      self,
      __DEV__ && enableOwnerStacks ? Error('react-stack-top-frame') : undefined,
      __DEV__ && enableOwnerStacks ? createTask(getTaskName(type)) : undefined,
    );
  }
}

const didWarnAboutKeySpread = {};

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsxDEV(type, config, maybeKey, isStaticChildren, source, self) {
  return jsxDEVImpl(
    type,
    config,
    maybeKey,
    isStaticChildren,
    source,
    self,
    __DEV__ && enableOwnerStacks ? Error('react-stack-top-frame') : undefined,
    __DEV__ && enableOwnerStacks ? createTask(getTaskName(type)) : undefined,
  );
}

function jsxDEVImpl(
  type,
  config,
  maybeKey,
  isStaticChildren,
  source,
  self,
  debugStack,
  debugTask,
) {
  if (__DEV__) {
    if (!enableOwnerStacks && !isValidElementType(type)) {
      // This is an invalid element type.
      //
      // We warn here so that we can get better stack traces but with enableOwnerStacks
      // enabled we don't need this because we get good stacks if we error in the
      // renderer anyway. The renderer is the only one that knows what types are valid
      // for this particular renderer so we let it error there instead.
      //
      // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.
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

      let typeString;
      if (type === null) {
        typeString = 'null';
      } else if (isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = `<${getComponentNameFromType(type.type) || 'Unknown'} />`;
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
    } else {
      // This is a valid element type.

      // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing
      // errors. We don't want exception behavior to differ between dev and
      // prod. (Rendering will throw with a helpful message and as soon as the
      // type is fixed, the key warnings will appear.)
      // When enableOwnerStacks is on, we no longer need the type here so this
      // comment is no longer true. Which is why we can run this even for invalid
      // types.
      const children = config.children;
      if (children !== undefined) {
        if (isStaticChildren) {
          if (isArray(children)) {
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

    // Warn about key spread regardless of whether the type is valid.
    if (hasOwnProperty.call(config, 'key')) {
      const componentName = getComponentNameFromType(type);
      const keys = Object.keys(config).filter(k => k !== 'key');
      const beforeExample =
        keys.length > 0
          ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}'
          : '{key: someKey}';
      if (!didWarnAboutKeySpread[componentName + beforeExample]) {
        const afterExample =
          keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';
        console.error(
          'A props object containing a "key" prop is being spread into JSX:\n' +
            '  let props = %s;\n' +
            '  <%s {...props} />\n' +
            'React keys must be passed directly to JSX without using spread:\n' +
            '  let props = %s;\n' +
            '  <%s key={someKey} {...props} />',
          beforeExample,
          componentName,
          afterExample,
          componentName,
        );
        didWarnAboutKeySpread[componentName + beforeExample] = true;
      }
    }

    let key = null;
    let ref = null;

    // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.
    if (maybeKey !== undefined) {
      if (__DEV__) {
        checkKeyStringCoercion(maybeKey);
      }
      key = '' + maybeKey;
    }

    if (hasValidKey(config)) {
      if (__DEV__) {
        checkKeyStringCoercion(config.key);
      }
      key = '' + config.key;
    }

    if (hasValidRef(config)) {
      if (!enableRefAsProp) {
        ref = config.ref;
        if (!disableStringRefs) {
          ref = coerceStringRef(ref, getOwner(), type);
        }
      }
      if (!disableStringRefs) {
        warnIfStringRefCannotBeAutoConverted(config, self);
      }
    }

    let props;
    if (
      (enableFastJSXWithoutStringRefs ||
        (enableRefAsProp && !('ref' in config))) &&
      !('key' in config)
    ) {
      // If key was not spread in, we can reuse the original props object. This
      // only works for `jsx`, not `createElement`, because `jsx` is a compiler
      // target and the compiler always passes a new object. For `createElement`,
      // we can't assume a new object is passed every time because it can be
      // called manually.
      //
      // Spreading key is a warning in dev. In a future release, we will not
      // remove a spread key from the props object. (But we'll still warn.) We'll
      // always pass the object straight through.
      props = config;
    } else {
      // We need to remove reserved props (key, prop, ref). Create a fresh props
      // object and copy over all the non-reserved props. We don't use `delete`
      // because in V8 it will deopt the object to dictionary mode.
      props = {};
      for (const propName in config) {
        // Skip over reserved prop names
        if (propName !== 'key' && (enableRefAsProp || propName !== 'ref')) {
          if (enableRefAsProp && !disableStringRefs && propName === 'ref') {
            props.ref = coerceStringRef(config[propName], getOwner(), type);
          } else {
            props[propName] = config[propName];
          }
        }
      }
    }

    if (!disableDefaultPropsExceptForClasses) {
      // Resolve default props
      if (type && type.defaultProps) {
        const defaultProps = type.defaultProps;
        for (const propName in defaultProps) {
          if (props[propName] === undefined) {
            props[propName] = defaultProps[propName];
          }
        }
      }
    }

    if (key || (!enableRefAsProp && ref)) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (!enableRefAsProp && ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }

    return ReactElement(
      type,
      key,
      ref,
      self,
      source,
      getOwner(),
      props,
      debugStack,
      debugTask,
    );
  }
}

/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */
export function createElement(type, config, children) {
  if (__DEV__) {
    if (!enableOwnerStacks && !isValidElementType(type)) {
      // This is just an optimistic check that provides a better stack trace before
      // owner stacks. It's really up to the renderer if it's a valid element type.
      // When owner stacks are enabled, we instead warn in the renderer and it'll
      // have the stack trace of the JSX element anyway.
      //
      // This is an invalid element type.
      //
      // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.
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

      let typeString;
      if (type === null) {
        typeString = 'null';
      } else if (isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = `<${getComponentNameFromType(type.type) || 'Unknown'} />`;
        info =
          ' Did you accidentally export a JSX literal instead of a component?';
      } else {
        typeString = typeof type;
      }

      console.error(
        'React.createElement: type is invalid -- expected a string (for ' +
          'built-in components) or a class/function (for composite ' +
          'components) but got: %s.%s',
        typeString,
        info,
      );
    } else {
      // This is a valid element type.

      // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing
      // errors. We don't want exception behavior to differ between dev and
      // prod. (Rendering will throw with a helpful message and as soon as the
      // type is fixed, the key warnings will appear.)
      for (let i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }

    // Unlike the jsx() runtime, createElement() doesn't warn about key spread.
  }

  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  if (config != null) {
    if (__DEV__) {
      if (
        !didWarnAboutOldJSXRuntime &&
        '__self' in config &&
        // Do not assume this is the result of an oudated JSX transform if key
        // is present, because the modern JSX transform sometimes outputs
        // createElement to preserve precedence between a static key and a
        // spread key. To avoid false positive warnings, we never warn if
        // there's a key.
        !('key' in config)
      ) {
        didWarnAboutOldJSXRuntime = true;
        console.warn(
          'Your app (or one of its dependencies) is using an outdated JSX ' +
            'transform. Update to the modern JSX transform for ' +
            'faster performance: https://react.dev/link/new-jsx-transform',
        );
      }
    }

    if (hasValidRef(config)) {
      if (!enableRefAsProp) {
        ref = config.ref;
        if (!disableStringRefs) {
          ref = coerceStringRef(ref, getOwner(), type);
        }
      }

      if (__DEV__ && !disableStringRefs) {
        warnIfStringRefCannotBeAutoConverted(config, config.__self);
      }
    }
    if (hasValidKey(config)) {
      if (__DEV__) {
        checkKeyStringCoercion(config.key);
      }
      key = '' + config.key;
    }

    // Remaining properties are added to a new props object
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        // Skip over reserved prop names
        propName !== 'key' &&
        (enableRefAsProp || propName !== 'ref') &&
        // Even though we don't use these anymore in the runtime, we don't want
        // them to appear as props, so in createElement we filter them out.
        // We don't have to do this in the jsx() runtime because the jsx()
        // transform never passed these as props; it used separate arguments.
        propName !== '__self' &&
        propName !== '__source'
      ) {
        if (enableRefAsProp && !disableStringRefs && propName === 'ref') {
          props.ref = coerceStringRef(config[propName], getOwner(), type);
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (__DEV__) {
    if (key || (!enableRefAsProp && ref)) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (!enableRefAsProp && ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    undefined,
    undefined,
    getOwner(),
    props,
    __DEV__ && enableOwnerStacks ? Error('react-stack-top-frame') : undefined,
    __DEV__ && enableOwnerStacks ? createTask(getTaskName(type)) : undefined,
  );
}

export function cloneAndReplaceKey(oldElement, newKey) {
  const clonedElement = ReactElement(
    oldElement.type,
    newKey,
    // When enableRefAsProp is on, this argument is ignored. This check only
    // exists to avoid the `ref` access warning.
    enableRefAsProp ? null : oldElement.ref,
    undefined,
    undefined,
    !__DEV__ && disableStringRefs ? undefined : oldElement._owner,
    oldElement.props,
    __DEV__ && enableOwnerStacks ? oldElement._debugStack : undefined,
    __DEV__ && enableOwnerStacks ? oldElement._debugTask : undefined,
  );
  if (__DEV__) {
    // The cloned element should inherit the original element's key validation.
    clonedElement._store.validated = oldElement._store.validated;
  }
  return clonedElement;
}

/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */
export function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error(
      `The argument must be a React element, but you passed ${element}.`,
    );
  }

  let propName;

  // Original props are copied
  const props = assign({}, element.props);

  // Reserved names are extracted
  let key = element.key;
  let ref = enableRefAsProp ? null : element.ref;

  // Owner will be preserved, unless ref is overridden
  let owner = !__DEV__ && disableStringRefs ? undefined : element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      owner = __DEV__ || !disableStringRefs ? getOwner() : undefined;
      if (!enableRefAsProp) {
        // Silently steal the ref from the parent.
        ref = config.ref;
        if (!disableStringRefs) {
          ref = coerceStringRef(ref, owner, element.type);
        }
      }
    }
    if (hasValidKey(config)) {
      if (__DEV__) {
        checkKeyStringCoercion(config.key);
      }
      key = '' + config.key;
    }

    // Remaining properties override existing props
    let defaultProps;
    if (
      !disableDefaultPropsExceptForClasses &&
      element.type &&
      element.type.defaultProps
    ) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        // Skip over reserved prop names
        propName !== 'key' &&
        (enableRefAsProp || propName !== 'ref') &&
        // ...and maybe these, too, though we currently rely on them for
        // warnings and debug information in dev. Need to decide if we're OK
        // with dropping them. In the jsx() runtime it's not an issue because
        // the data gets passed as separate arguments instead of props, but
        // it would be nice to stop relying on them entirely so we can drop
        // them from the internal Fiber field.
        propName !== '__self' &&
        propName !== '__source' &&
        // Undefined `ref` is ignored by cloneElement. We treat it the same as
        // if the property were missing. This is mostly for
        // backwards compatibility.
        !(enableRefAsProp && propName === 'ref' && config.ref === undefined)
      ) {
        if (
          !disableDefaultPropsExceptForClasses &&
          config[propName] === undefined &&
          defaultProps !== undefined
        ) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          if (enableRefAsProp && !disableStringRefs && propName === 'ref') {
            props.ref = coerceStringRef(config[propName], owner, element.type);
          } else {
            props[propName] = config[propName];
          }
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  const clonedElement = ReactElement(
    element.type,
    key,
    ref,
    undefined,
    undefined,
    owner,
    props,
    __DEV__ && enableOwnerStacks ? element._debugStack : undefined,
    __DEV__ && enableOwnerStacks ? element._debugTask : undefined,
  );

  for (let i = 2; i < arguments.length; i++) {
    validateChildKeys(arguments[i], clonedElement.type);
  }

  return clonedElement;
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
    if (enableOwnerStacks) {
      // When owner stacks is enabled no warnings happens. All we do is
      // mark elements as being in a valid static child position so they
      // don't need keys.
      if (isValidElement(node)) {
        if (node._store) {
          node._store.validated = 1;
        }
      }
      return;
    }
    if (typeof node !== 'object' || !node) {
      return;
    }
    if (node.$$typeof === REACT_CLIENT_REFERENCE) {
      // This is a reference to a client component so it's unknown.
    } else if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const child = node[i];
        if (isValidElement(child)) {
          validateExplicitKey(child, parentType);
        }
      }
    } else if (isValidElement(node)) {
      // This element was passed in a valid location.
      if (node._store) {
        node._store.validated = 1;
      }
    } else {
      const iteratorFn = getIteratorFn(node);
      if (typeof iteratorFn === 'function') {
        // Entry iterators used to provide implicit keys,
        // but now we print a separate warning for them later.
        if (iteratorFn !== node.entries) {
          const iterator = iteratorFn.call(node);
          if (iterator !== node) {
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
}

/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

const ownerHasKeyUseWarning = {};

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
  if (enableOwnerStacks) {
    // Skip. Will verify in renderer instead.
    return;
  }
  if (__DEV__) {
    if (!element._store || element._store.validated || element.key != null) {
      return;
    }
    element._store.validated = 1;

    const currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }
    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

    // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.
    let childOwner = '';
    if (element && element._owner != null && element._owner !== getOwner()) {
      let ownerName = null;
      if (typeof element._owner.tag === 'number') {
        ownerName = getComponentNameFromType(element._owner.type);
      } else if (typeof element._owner.name === 'string') {
        ownerName = element._owner.name;
      }
      // Give the component that originally created this child.
      childOwner = ` It was passed a child from ${ownerName}.`;
    }

    const prevGetCurrentStack = ReactSharedInternals.getCurrentStack;
    ReactSharedInternals.getCurrentStack = function () {
      const owner = element._owner;
      // Add an extra top frame while an element is being validated
      let stack = describeUnknownElementTypeFrameInDEV(
        element.type,
        owner ? owner.type : null,
      );
      // Delegate to the injected renderer-specific implementation
      if (prevGetCurrentStack) {
        stack += prevGetCurrentStack() || '';
      }
      return stack;
    };
    console.error(
      'Each child in a list should have a unique "key" prop.' +
        '%s%s See https://react.dev/link/warning-keys for more information.',
      currentComponentErrorInfo,
      childOwner,
    );
    ReactSharedInternals.getCurrentStack = prevGetCurrentStack;
  }
}

function getCurrentComponentErrorInfo(parentType) {
  if (__DEV__) {
    let info = '';
    const owner = getOwner();
    if (owner) {
      const name = getComponentNameFromType(owner.type);
      if (name) {
        info = '\n\nCheck the render method of `' + name + '`.';
      }
    }
    if (!info) {
      const parentName = getComponentNameFromType(parentType);
      if (parentName) {
        info = `\n\nCheck the top-level render call using <${parentName}>.`;
      }
    }
    return info;
  }
}

function coerceStringRef(mixedRef, owner, type) {
  if (disableStringRefs) {
    return mixedRef;
  }

  let stringRef;
  if (typeof mixedRef === 'string') {
    stringRef = mixedRef;
  } else {
    if (typeof mixedRef === 'number' || typeof mixedRef === 'boolean') {
      if (__DEV__) {
        checkPropStringCoercion(mixedRef, 'ref');
      }
      stringRef = '' + mixedRef;
    } else {
      return mixedRef;
    }
  }

  const callback = stringRefAsCallbackRef.bind(null, stringRef, type, owner);
  // This is used to check whether two callback refs conceptually represent
  // the same string ref, and can therefore be reused by the reconciler. Needed
  // for backwards compatibility with old Meta code that relies on string refs
  // not being reattached on every render.
  callback.__stringRef = stringRef;
  callback.__type = type;
  callback.__owner = owner;
  return callback;
}

function stringRefAsCallbackRef(stringRef, type, owner, value) {
  if (disableStringRefs) {
    return;
  }
  if (!owner) {
    throw new Error(
      `Element ref was specified as a string (${stringRef}) but no owner was set. This could happen for one of` +
        ' the following reasons:\n' +
        '1. You may be adding a ref to a function component\n' +
        "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
        '3. You have multiple copies of React loaded\n' +
        'See https://react.dev/link/refs-must-have-owner for more information.',
    );
  }
  if (owner.tag !== ClassComponent) {
    throw new Error(
      'Function components cannot have string refs. ' +
        'We recommend using useRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-string-ref',
    );
  }

  if (__DEV__) {
    if (
      // Will already warn with "Function components cannot be given refs"
      !(typeof type === 'function' && !isReactClass(type))
    ) {
      const componentName = getComponentNameFromFiber(owner) || 'Component';
      if (!didWarnAboutStringRefs[componentName]) {
        console.error(
          'Component "%s" contains the string ref "%s". Support for string refs ' +
            'will be removed in a future major release. We recommend using ' +
            'useRef() or createRef() instead. ' +
            'Learn more about using refs safely here: ' +
            'https://react.dev/link/strict-mode-string-ref',
          componentName,
          stringRef,
        );
        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }

  const inst = owner.stateNode;
  if (!inst) {
    throw new Error(
      `Missing owner for string ref ${stringRef}. This error is likely caused by a ` +
        'bug in React. Please file an issue.',
    );
  }

  const refs = inst.refs;
  if (value === null) {
    delete refs[stringRef];
  } else {
    refs[stringRef] = value;
  }
}

function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}
