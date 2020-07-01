/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: remove this injection altogether.

import ModernBeforeInputEventPlugin from '../events/plugins/ModernBeforeInputEventPlugin';
import ModernChangeEventPlugin from '../events/plugins/ModernChangeEventPlugin';
import ModernEnterLeaveEventPlugin from '../events/plugins/ModernEnterLeaveEventPlugin';
import ModernSelectEventPlugin from '../events/plugins/ModernSelectEventPlugin';
import ModernSimpleEventPlugin from '../events/plugins/ModernSimpleEventPlugin';

import {injectEventPlugins} from '../legacy-events/EventPluginRegistry';

injectEventPlugins([
  ModernSimpleEventPlugin,
  ModernEnterLeaveEventPlugin,
  ModernChangeEventPlugin,
  ModernSelectEventPlugin,
  ModernBeforeInputEventPlugin,
]);
