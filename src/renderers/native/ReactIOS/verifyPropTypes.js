/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule verifyPropTypes
 * @flow
 */
'use strict';

var ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');

export type ComponentInterface = ReactClass<any> | {
  name?: string;
  displayName?: string;
  propTypes: Object;
};

function verifyPropTypes(
  componentInterface: ComponentInterface,
  viewConfig: Object,
  nativePropsToIgnore?: ?Object
) {
  if (!viewConfig) {
    return; // This happens for UnimplementedView.
  }
  var componentName = componentInterface.name ||
    componentInterface.displayName ||
    'unknown';
  if (!componentInterface.propTypes) {
    throw new Error(
      '`' + componentName + '` has no propTypes defined`'
    );
  }

  var nativeProps = viewConfig.NativeProps;
  for (var prop in nativeProps) {
    if (!componentInterface.propTypes[prop] &&
        !ReactNativeStyleAttributes[prop] &&
        (!nativePropsToIgnore || !nativePropsToIgnore[prop])) {
      var message;
      if (componentInterface.propTypes.hasOwnProperty(prop)) {
        message = '`' + componentName + '` has incorrectly defined propType for native prop `' +
        viewConfig.uiViewClassName + '.' + prop + '` of native type `' + nativeProps[prop];
      } else {
        message = '`' + componentName + '` has no propType for native prop `' +
        viewConfig.uiViewClassName + '.' + prop + '` of native type `' +
        nativeProps[prop] + '`';
      };
      message += '\nIf you haven\'t changed this prop yourself, this usually means that ' +
        'your versions of the native code and JavaScript code are out of sync. Updating both ' +
        'should make this error go away.';
      throw new Error(message);
    }
  }
}

module.exports = verifyPropTypes;
