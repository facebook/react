/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUnstableNativeDependenciesEntry
 */

import {injection as EventPluginUtilsInjection} from 'EventPluginUtils';
import ResponderEventPlugin from 'ResponderEventPlugin';
import ResponderTouchHistoryStore from 'ResponderTouchHistoryStore';

const ReactDOMUnstableNativeDependencies = {
  injectComponentTree: EventPluginUtilsInjection.injectComponentTree,
  ResponderEventPlugin,
  ResponderTouchHistoryStore,
};

// Inject react-dom's ComponentTree into this module.
const ReactDOM = require('react-dom');
const {
  ReactDOMComponentTree,
} = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
EventPluginUtilsInjection.injectComponentTree(ReactDOMComponentTree);

// TODO: use ESM export?
module.exports = ReactDOMUnstableNativeDependencies;
