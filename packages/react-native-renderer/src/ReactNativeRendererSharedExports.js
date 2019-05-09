/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {create} from './ReactNativeAttributePayload';
import {warnForStyleProps} from './NativeMethodsMixinUtils';

import warningWithoutStack from 'shared/warningWithoutStack';

// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

export function setNativeProps(handle: any, nativeProps: Object): void {
  if (handle._nativeTag == null) {
    warningWithoutStack(
      handle._nativeTag != null,
      "setNativeProps was called with a ref that isn't a " +
        'native component. Use React.forwardRef to get access to the underlying native component',
    );
    return;
  }

  if (__DEV__) {
    warnForStyleProps(nativeProps, handle.viewConfig.validAttributes);
  }

  const updatePayload = create(nativeProps, handle.viewConfig.validAttributes);
  // Avoid the overhead of bridge calls if there's no update.
  // This is an expensive no-op for Android, and causes an unnecessary
  // view invalidation for certain components (eg RCTTextInput) on iOS.
  if (updatePayload != null) {
    UIManager.updateView(
      handle._nativeTag,
      handle.viewConfig.uiViewClassName,
      updatePayload,
    );
  }
}
