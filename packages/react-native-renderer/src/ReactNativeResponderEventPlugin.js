/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import createResponderEventPlugin from 'events/createResponderEventPlugin';

import type { TopLevelType } from 'events/TopLevelEventTypes';

const TopLevelTypes = {
  topMouseDown: (('topMouseDown': any): TopLevelType),
  topMouseMove: (('topMouseMove': any): TopLevelType),
  topMouseUp: (('topMouseUp': any): TopLevelType),
  topScroll: (('topScroll': any): TopLevelType),
  topSelectionChange: (('topSelectionChange': any): TopLevelType),
  topTouchCancel: (('topTouchCancel': any): TopLevelType),
  topTouchEnd: (('topTouchEnd': any): TopLevelType),
  topTouchMove: (('topTouchMove': any): TopLevelType),
  topTouchStart: (('topTouchStart': any): TopLevelType),
};

const {ResponderEventPlugin} = createResponderEventPlugin(TopLevelTypes);

export default ResponderEventPlugin;
