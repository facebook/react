/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {setComponentTree} from 'legacy-events/EventPluginUtils';

import {
  getFiberCurrentPropsFromNode,
  getInstanceFromNode,
  getNodeFromInstance,
} from './ReactDOMComponentTree';

import LegacyBeforeInputEventPlugin from '../events/plugins/LegacyBeforeInputEventPlugin';
import LegacyChangeEventPlugin from '../events/plugins/LegacyChangeEventPlugin';
import LegacyEnterLeaveEventPlugin from '../events/plugins/LegacyEnterLeaveEventPlugin';
import LegacySelectEventPlugin from '../events/plugins/LegacySelectEventPlugin';
import LegacySimpleEventPlugin from '../events/plugins/LegacySimpleEventPlugin';

import ModernBeforeInputEventPlugin from '../events/plugins/ModernBeforeInputEventPlugin';
import ModernChangeEventPlugin from '../events/plugins/ModernChangeEventPlugin';
import ModernEnterLeaveEventPlugin from '../events/plugins/ModernEnterLeaveEventPlugin';
import ModernSelectEventPlugin from '../events/plugins/ModernSelectEventPlugin';
import ModernSimpleEventPlugin from '../events/plugins/ModernSimpleEventPlugin';

import {
  injectEventPluginOrder,
  injectEventPluginsByName,
  injectEventPlugins,
} from 'legacy-events/EventPluginRegistry';
import {enableModernEventSystem} from 'shared/ReactFeatureFlags';

if (enableModernEventSystem) {
  injectEventPlugins([
    ModernSimpleEventPlugin,
    ModernEnterLeaveEventPlugin,
    ModernChangeEventPlugin,
    ModernSelectEventPlugin,
    ModernBeforeInputEventPlugin,
  ]);
} else {
  /**
   * Specifies a deterministic ordering of `EventPlugin`s. A convenient way to
   * reason about plugins, without having to package every one of them. This
   * is better than having plugins be ordered in the same order that they
   * are injected because that ordering would be influenced by the packaging order.
   * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
   * preventing default on events is convenient in `SimpleEventPlugin` handlers.
   */
  const DOMEventPluginOrder = [
    'ResponderEventPlugin',
    'SimpleEventPlugin',
    'EnterLeaveEventPlugin',
    'ChangeEventPlugin',
    'SelectEventPlugin',
    'BeforeInputEventPlugin',
  ];

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  injectEventPluginOrder(DOMEventPluginOrder);
  setComponentTree(
    getFiberCurrentPropsFromNode,
    getInstanceFromNode,
    getNodeFromInstance,
  );

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  injectEventPluginsByName({
    SimpleEventPlugin: LegacySimpleEventPlugin,
    EnterLeaveEventPlugin: LegacyEnterLeaveEventPlugin,
    ChangeEventPlugin: LegacyChangeEventPlugin,
    SelectEventPlugin: LegacySelectEventPlugin,
    BeforeInputEventPlugin: LegacyBeforeInputEventPlugin,
  });
}
