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

var ReactDescriptor = require('ReactDescriptor');

var invariant = require('invariant');

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

var ReactLegacyDescriptorFactory = {};

ReactLegacyDescriptorFactory.wrapFactory = function(factory) {
  invariant(
    ReactDescriptor.isValidFactory(factory),
    'This is suppose to accept a descriptor factory'
  );
  var legacyDescriptorFactory = function(config, children) {
    // This factory should not be called when the new JSX transform is in place.
    // TODO: Warning - Use JSX instead of direct function calls.
    return factory.apply(this, arguments);
  };
  proxyStaticMethods(legacyDescriptorFactory, factory.type);
  legacyDescriptorFactory.isReactLegacyFactory = true;
  legacyDescriptorFactory.type = factory.type;
  return legacyDescriptorFactory;
};

module.exports = ReactLegacyDescriptorFactory;
