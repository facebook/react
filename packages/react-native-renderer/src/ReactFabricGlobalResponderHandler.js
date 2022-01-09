/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

const ReactFabricGlobalResponderHandler = {
  onChange: function(from: any, to: any, blockNativeResponder: boolean) {
    const fromOrTo = from || to;
    const fromOrToStateNode = fromOrTo && fromOrTo.stateNode;
    const isFabric = !!(
      fromOrToStateNode && fromOrToStateNode.canonical._internalInstanceHandle
    );

    if (isFabric) {
      if (from) {
        // equivalent to clearJSResponder
        nativeFabricUIManager.setIsJSResponder(
          from.stateNode.node,
          false,
          blockNativeResponder || false,
        );
      }

      if (to) {
        // equivalent to setJSResponder
        nativeFabricUIManager.setIsJSResponder(
          to.stateNode.node,
          true,
          blockNativeResponder || false,
        );
      }
    } else {
      if (to !== null) {
        const tag = to.stateNode.canonical._nativeTag;
        UIManager.setJSResponder(tag, blockNativeResponder);
      } else {
        UIManager.clearJSResponder();
      }
    }
  },
};

export default ReactFabricGlobalResponderHandler;
