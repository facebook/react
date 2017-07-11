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

const EventPluginUtils = require('EventPluginUtils');
const ResponderEventPlugin = require('ResponderEventPlugin');
const ResponderTouchHistoryStore = require('ResponderTouchHistoryStore');

const ReactDOMUnstableNativeDependencies = {
  injectComponentTree: EventPluginUtils.injection.injectComponentTree,
  ResponderEventPlugin,
  ResponderTouchHistoryStore,
};

// Inject react-dom's ComponentTree into this module.
const ReactDOM = require('react-dom');
const {
  ReactDOMComponentTree,
} = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
ReactDOMUnstableNativeDependencies.injectComponentTree(ReactDOMComponentTree);

module.exports = ReactDOMUnstableNativeDependencies;
