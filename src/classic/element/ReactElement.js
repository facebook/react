/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElement
 */

'use strict';

var ReactContext = require('ReactContext');
var ReactCurrentOwner = require('ReactCurrentOwner');

var assign = require('Object.assign');
var warning = require('warning');

var RESERVED_PROPS = {
  key: true,
  ref: true
};

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} object
 * @param {string} key
 */
function defineWarningProperty(object, key) {
  Object.defineProperty(object, key, {

    configurable: false,
    enumerable: true,

    get: function() {
      if (!this._store) {
        return null;
      }
      return this._store[key];
    },

    set: function(value) {
      warning(
        false,
        'Don\'t set the %s property of the React element. Instead, ' +
        'specify the correct value when initially creating the element.',
        key
      );
      this._store[key] = value;
    }

  });
}

/**
 * This is updated to true if the membrane is successfully created.
 */
var useMutationMembrane = false;

/**
 * React instances own source ID is a randomly generated string. It does not
 * have to be globally unique, just difficult to guess.
 */
var ownSourceID =
  (typeof crypto === 'object' && crypto.getRandomValues ?
    crypto.getRandomValues(new Uint32Array(1))[0] :
    ~(Math.random() * (1 << 31))
  ).toString(36);

/**
 * If trustSource() is called, becomes an mapping of sourceIDs we trust as
 * valid React Elements.
 */
var trustedSourceIDs; // ?{ [sourceID: string]: true }

/**
 * If true, dangerously trust all sources. If false, only trust explicit
 * sources.
 *
 * If null, trust all sources but warn if not explicitly trusted.
 */
var trustAllSources = null; // ?Boolean

/**
 * Updated to true if a warning is logged so we don't spam console.
 */
var hasWarnedAboutUntrustedSource;

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} element
 */
function defineMutationMembrane(prototype) {
  try {
    var pseudoFrozenProperties = {
      props: true
    };
    for (var key in pseudoFrozenProperties) {
      defineWarningProperty(prototype, key);
    }
    useMutationMembrane = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

/**
 * Base constructor for all React elements. This is only used to make this
 * work with a dynamic instanceof check. Nothing should live on this prototype.
 *
 * @param {*} type
 * @param {string|object} ref
 * @param {*} key
 * @param {*} props
 * @internal
 */
var ReactElement = function(type, key, ref, owner, context, props) {
  // Built-in properties that belong on the element
  this.type = type;
  this.key = key;
  this.ref = ref;

  // Record the component responsible for creating this element.
  this._owner = owner;

  // TODO: Deprecate withContext, and then the context becomes accessible
  // through the owner.
  this._context = context;

  if (__DEV__) {
    // The validation flag and props are currently mutative. We put them on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    this._store = {props: props, originalProps: assign({}, props)};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    try {
      Object.defineProperty(this._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true
      });
    } catch (x) {
    }
    this._store.validated = false;

    // We're not allowed to set props directly on the object so we early
    // return and rely on the prototype membrane to forward to the backing
    // store.
    if (useMutationMembrane) {
      Object.freeze(this);
      return;
    }
  }

  this.props = props;
};

// We intentionally don't expose the function on the constructor property.
// ReactElement should be indistinguishable from a plain object.
ReactElement.prototype = {
  _source: ownSourceID,
  _isReactElement: true
};

if (__DEV__) {
  defineMutationMembrane(ReactElement.prototype);
}


/**
 * Return this React module's source ID.
 */
ReactElement.getSourceID = function() {
  return ownSourceID;
};

/**
 * Allows this React module to trust React elements produced from another React
 * module, potentially from a Server or from another Realm (iframe, webworker).
 */
ReactElement.trustSource = function(sourceID) {
  if (!trustedSourceIDs) {
    trustedSourceIDs = {};
  }
  trustedSourceIDs[sourceID] = true;
  // Calling trustSource implies using React's trusted source.
  // TODO: remove in a future version when security is on by default and
  // trustAllSources is no longer a ?Boolean.
  if (trustAllSources === null) {
    trustAllSources = false;
  }
};

/**
 * Trust React elements regardless of their source, or even if they have an
 * unknown source. Using this method may be helpful during a refactor to support
 * React's security model, but should be avoided as it could allow XSS attacks
 * in certain conditions.
 *
 * For backwards compatibility, the default behavior is to trust all sources,
 * but to warn in __DEV__ when rendering a React component from an unknown
 * source. In a future version of React only explicitly trusted sources may
 * provide React components.
 */
ReactElement.dangerouslyTrustAllSources = function(acceptPossibleXSSHoles) {
  trustAllSources =
    acceptPossibleXSSHoles === undefined ? true : acceptPossibleXSSHoles;
};

ReactElement.createElement = function(type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref;
    key = config.key === undefined ? null : '' + config.key;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return new ReactElement(
    type,
    key,
    ref,
    ReactCurrentOwner.current,
    ReactContext.current,
    props
  );
};

ReactElement.createFactory = function(type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook TODO: Warn if this is accessed
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceProps = function(oldElement, newProps) {
  var newElement = new ReactElement(
    oldElement.type,
    oldElement.key,
    oldElement.ref,
    oldElement._owner,
    oldElement._context,
    newProps
  );

  if (__DEV__) {
    // If the key on the original is valid, then the clone is valid
    newElement._store.validated = oldElement._store.validated;
  }
  return newElement;
};

ReactElement.cloneElement = function(element, config, children) {
  var propName;

  // Original props are copied
  var props = assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config != null) {
    if (config.ref !== undefined) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    // Remaining properties override existing props
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return new ReactElement(
    element.type,
    key,
    ref,
    owner,
    element._context,
    props
  );
};

/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function(object) {
  // ReactTestUtils is often used outside of beforeEach where as React is
  // within it. This leads to two different instances of React on the same
  // page. To identify a element from a different React instance we use
  // a flag instead of an instanceof check.
  var isElement = !!(object && object._isReactElement);
  // if (isElement && !(object instanceof ReactElement)) {
  // This is an indicator that you're using multiple versions of React at the
  // same time. This will screw with ownership and stuff. Fix it, please.
  // TODO: We could possibly warn here.
  // }
  if (!isElement) {
    return false;
  }

  var sourceID = object && object._source;

  // TODO: remove in a future version when security is on by default and
  // trustAllSources is no longer a ?Boolean.
  if (__DEV__) {
    if (trustAllSources === null &&
        !hasWarnedAboutUntrustedSource &&
        !(sourceID && sourceID === ownSourceID)) {
      hasWarnedAboutUntrustedSource = true;
      warning(
        false,
        'React is rendering an element from an unknown or foreign source. ' +
        'This is potentially malicious and a future version of React will ' +
        'not render this element. Call ' +
        'React.dangerouslyTrustAllSources(false) to disable rendering from ' +
        'unknown and foriegn sources.'
      );
    }
  }

  // Determine if we trust the source of this particular React Element.
  return trustAllSources !== false ||
         sourceID && (
           sourceID === ownSourceID ||
           trustedSourceIDs && trustedSourceIDs.hasOwnProperty(sourceID)
         );
};

module.exports = ReactElement;
