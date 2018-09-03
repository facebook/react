/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactDOM from 'react-dom';
import * as EventPluginUtils from 'events/EventPluginUtils';
import ResponderEventPlugin from 'events/ResponderEventPlugin';
import ResponderTouchHistoryStore from 'events/ResponderTouchHistoryStore';

// This is used by react-native-web.
export function injectComponentTree(ComponentTree) {
  EventPluginUtils.setComponentTree(
    ComponentTree.getFiberCurrentPropsFromNode,
    ComponentTree.getInstanceFromNode,
    ComponentTree.getNodeFromInstance,
  );
}

export {ResponderEventPlugin, ResponderTouchHistoryStore};

// Inject react-dom's ComponentTree into this module.
// Keep in sync with ReactDOM.js and ReactTestUtils.js:
const [
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;
EventPluginUtils.setComponentTree(
  getFiberCurrentPropsFromNode,
  getInstanceFromNode,
  getNodeFromInstance,
);
