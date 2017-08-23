/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMClientInjection
 */

'use strict';

import BeforeInputEventPlugin from 'BeforeInputEventPlugin';
import ChangeEventPlugin from 'ChangeEventPlugin';
import DOMEventPluginOrder from 'DOMEventPluginOrder';
import EnterLeaveEventPlugin from 'EnterLeaveEventPlugin';
import {injection as EventPluginRegistryInjection} from 'EventPluginRegistry';
import {injection as EventPluginUtilsInjection} from 'EventPluginUtils';
import {handleTopLevel} from 'ReactBrowserEventEmitter';
import * as ReactDOMComponentTree from 'ReactDOMComponentTree';
import {setHandleTopLevel} from 'ReactDOMEventListener';
import SelectEventPlugin from 'SelectEventPlugin';
import SimpleEventPlugin from 'SimpleEventPlugin';

setHandleTopLevel(handleTopLevel);

/**
 * Inject modules for resolving DOM hierarchy and plugin ordering.
 */
EventPluginRegistryInjection.injectEventPluginOrder(DOMEventPluginOrder);
EventPluginUtilsInjection.injectComponentTree(ReactDOMComponentTree);

/**
 * Some important event plugins included by default (without having to require
 * them).
 */
EventPluginRegistryInjection.injectEventPluginsByName({
  SimpleEventPlugin,
  EnterLeaveEventPlugin,
  ChangeEventPlugin,
  SelectEventPlugin,
  BeforeInputEventPlugin,
});
