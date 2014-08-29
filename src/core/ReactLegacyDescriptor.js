/**
 * Copyright 2014 Facebook, Inc.
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
 * @providesModule ReactLegacyDescriptor
 */

"use strict";

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactDescriptor = require('ReactDescriptor');

var invariant = require('invariant');
var monitorCodeUse = require('monitorCodeUse');
var warning = require('warning');

var legacyFactoryLogs = {};
function warnForLegacyFactoryCall() {
  if (!ReactLegacyDescriptorFactory._isLegacyCallWarningEnabled) {
    return;
  }
  var owner = ReactCurrentOwner.current;
  var name = owner && owner.constructor ? owner.constructor.displayName : '';
  if (!name) {
    name = 'Something';
  }
  if (legacyFactoryLogs.hasOwnProperty(name)) {
    return;
  }
  legacyFactoryLogs[name] = true;
  warning(
    false,
    name + ' is calling a React component directly. ' +
    'Use a factory or JSX instead. See: http://fb.me/react-legacyfactory'
  );
  monitorCodeUse('react_legacy_factory_call', { version: 1, name: name });
}

function warnForPlainFunctionType(type) {
  var isReactClass =
    type.prototype &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function';
  if (isReactClass) {
    warning(
      false,
      'Did not expect to get a React class here. Use `Component` instead ' +
      'of `Component.type` or `this.constructor`.'
    );
  } else {
    if (!type._reactWarnedForThisType) {
      try {
        type._reactWarnedForThisType = true;
      } catch (x) {
        // just incase this is a frozen object or some special object
      }
      monitorCodeUse('react_non_component_in_jsx', { name: type.name });
    }
    // TODO: This pattern is heavily used by ReactMenu and therefore we
    // cannot yet warn without spamming users too much.
    // warning(
    //   false,
    //   'This JSX uses a plain function. Only React components are ' +
    //   'valid in React\'s JSX transform.'
    // );
  }
}

/**
 * Transfer static properties from the source to the target. Functions are
 * rebound to have this reflect the original source.
 */
function proxyStaticMethods(target, source) {
  if (typeof source !== 'function') {
    return;
  }
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      var value = source[key];
      if (typeof value === 'function') {
        var bound = value.bind(source);
        // Copy any properties defined on the function, such as `isRequired` on
        // a PropTypes validator. (mergeInto refuses to work on functions.)
        for (var k in value) {
          if (value.hasOwnProperty(k)) {
            bound[k] = value[k];
          }
        }
        target[key] = bound;
      } else {
        target[key] = value;
      }
    }
  }
}

// We use an object instead of a boolean because booleans are ignored by our
// mocking libraries when these factories gets mocked.
var LEGACY_MARKER = {};

var ReactLegacyDescriptorFactory = {};

ReactLegacyDescriptorFactory.wrapCreateFactory = function(createFactory) {
  var legacyCreateFactory = function(type) {
    if (typeof type !== 'function') {
      // Non-function types cannot be legacy factories
      return createFactory(type);
    }

    if (type.isReactLegacyFactory) {
      // This is probably a legacy factory created by ReactCompositeComponent.
      // We unwrap it to get to the underlying class.
      return createFactory(type.type);
    }

    if (__DEV__) {
      warnForPlainFunctionType(type);
    }

    // Unless it's a legacy factory, then this is probably a plain function,
    // that is expecting to be invoked by JSX. We can just return it as is.
    return type;
  };
  return legacyCreateFactory;
};

ReactLegacyDescriptorFactory.wrapCreateDescriptor = function(createDescriptor) {
  var legacyCreateDescriptor = function(type, props, children) {
    if (typeof type !== 'function') {
      // Non-function types cannot be legacy factories
      return createDescriptor.apply(this, arguments);
    }

    if (type.isReactLegacyFactory) {
      // This is probably a legacy factory created by ReactCompositeComponent.
      // We unwrap it to get to the underlying class.
      if (type._isMockFunction) {
        // If this is a mock function, people will expect it to be called. We
        // will actually call the original mock factory function instead. This
        // future proofs unit testing that assume that these are classes.
        type.type._mockedReactClassConstructor = type;
      }
      var args = Array.prototype.slice.call(arguments, 0);
      args[0] = type.type;
      return createDescriptor.apply(this, args);
    }

    if (__DEV__) {
      warnForPlainFunctionType(type);
    }

    // This is being called with a plain function we should invoke it
    // immediately as if this was used with legacy JSX.
    return type.apply(null, Array.prototype.slice.call(arguments, 1));
  };
  return legacyCreateDescriptor;
};

ReactLegacyDescriptorFactory.wrapFactory = function(factory) {
  invariant(
    ReactDescriptor.isValidFactory(factory),
    'This is suppose to accept a descriptor factory'
  );
  var legacyDescriptorFactory = function(config, children) {
    // This factory should not be called when JSX is used. Use JSX instead.
    if (__DEV__) {
      warnForLegacyFactoryCall();
    }
    return factory.apply(this, arguments);
  };
  proxyStaticMethods(legacyDescriptorFactory, factory.type);
  legacyDescriptorFactory.isReactLegacyFactory = LEGACY_MARKER;
  legacyDescriptorFactory.type = factory.type;
  return legacyDescriptorFactory;
};

ReactLegacyDescriptorFactory._isLegacyCallWarningEnabled = true;

module.exports = ReactLegacyDescriptorFactory;
