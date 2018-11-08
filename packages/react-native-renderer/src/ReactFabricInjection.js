/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import './ReactNativeInjectionShared';

import * as ReactFabricComponentTree from './ReactFabricComponentTree';
import * as EventPluginUtils from 'events/EventPluginUtils';
import ReactFabricGlobalResponderHandler from './ReactFabricGlobalResponderHandler';
import ResponderEventPlugin from 'events/ResponderEventPlugin';

EventPluginUtils.setComponentTree(
  ReactFabricComponentTree.getFiberCurrentPropsFromNode,
  ReactFabricComponentTree.getInstanceFromNode,
  ReactFabricComponentTree.getNodeFromInstance,
);

ResponderEventPlugin.injection.injectGlobalResponderHandler(
  ReactFabricGlobalResponderHandler,
);
