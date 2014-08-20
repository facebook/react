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
 * @providesModule instantiateReactComponent
 * @typechecks static-only
 */

"use strict";

var warning = require('warning');

var ReactDescriptor = require('ReactDescriptor');
var ReactLegacyDescriptor = require('ReactLegacyDescriptor');
var ReactEmptyComponent = require('ReactEmptyComponent');

/**
 * Given `type` and `props` invoke the type function and create an instance from
 * it. For the normal case it just runs the constructor. For mocks we need to
 * invoke the convenience constructor and resolve that into an instance.
 *
 * @param {function} type
 * @param {*} props
 * @return {object} A new instance of `type`.
 * @protected
 */
function createInstance(type, props) {
  if (__DEV__) {
    if (type._mockedReactClassConstructor) {
      // If this is a mocked class, we treat the legacy factory as if it was the
      // class constructor for future proofing unit tests. Because this might
      // be mocked as a legacy factory, we ignore any warnings triggerd by
      // this temporary hack.
      ReactLegacyDescriptor._isLegacyCallWarningEnabled = false;
      var instance;
      try {
        instance = new type._mockedReactClassConstructor(props);
      } finally {
        ReactLegacyDescriptor._isLegacyCallWarningEnabled = true;
      }

      // If the mock implementation was a legacy factory, then it returns a
      // descriptor. We need to turn this into a real component instance.
      if (ReactDescriptor.isValidDescriptor(instance)) {
        type = instance.type;
        props = instance.props;
        instance = new type(props);
      }

      var render = instance.render;
      if (!render) {
        // For auto-mocked factories, the prototype isn't shimmed and therefore
        // there is no render function on the instance. We replace the whole
        // component with an empty component instance instead.
        var descriptor = ReactEmptyComponent.getEmptyComponent();
        type = descriptor.type;
        props = descriptor.props;
        instance = new type(props);
      } else if (render._isMockFunction && !render._getMockImplementation()) {
        // Auto-mocked components may have a prototype with a mocked render
        // function. For those, we'll need to mock the result of the render
        // since we consider undefined to be invalid results from render.
        render.mockImplementation(
          ReactEmptyComponent.getEmptyComponent
        );
      }
    }
  }
  // Normal case for non-mocks
  return new type(props);
}

/**
 * Given a `componentDescriptor` create an instance that will actually be
 * mounted.
 *
 * @param {object} descriptor
 * @return {object} A new instance of componentDescriptor's constructor.
 * @protected
 */
function instantiateReactComponent(descriptor) {
  if (__DEV__) {
    warning(
      descriptor && (typeof descriptor.type === 'function' ||
                     typeof descriptor.type === 'string'),
      'Only functions or strings can be mounted as React components.'
      // Not really strings yet, but as soon as I solve the cyclic dep, they
      // will be allowed here.
    );
  }

  var instance = createInstance(descriptor.type, descriptor.props);

  if (__DEV__) {
    warning(
      typeof instance.construct === 'function' &&
      typeof instance.mountComponent === 'function' &&
      typeof instance.receiveComponent === 'function',
      'Only React Components can be mounted.'
    );
  }

  // This actually sets up the internal instance. This will become decoupled
  // from the public instance in a future diff.
  instance.construct(descriptor);
  return instance;
}

module.exports = instantiateReactComponent;
