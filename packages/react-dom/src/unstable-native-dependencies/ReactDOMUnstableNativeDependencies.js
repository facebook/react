/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactDOM from 'react-dom';
import {setComponentTree} from 'legacy-events/EventPluginUtils';
import ResponderEventPlugin from 'legacy-events/ResponderEventPlugin';
import ResponderTouchHistoryStore from 'legacy-events/ResponderTouchHistoryStore';

// Inject react-dom's ComponentTree into this module.
// Keep in sync with ReactDOM.js, ReactTestUtils.js, and ReactTestUtilsAct.js:
const [
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  injectEventPluginsByName,
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

setComponentTree(
  getFiberCurrentPropsFromNode,
  getInstanceFromNode,
  getNodeFromInstance,
);

export {
  ResponderEventPlugin,
  ResponderTouchHistoryStore,
  injectEventPluginsByName,
};
