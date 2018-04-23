/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import createResponderEventPlugin from 'events/createResponderEventPlugin';

const TopLevelTypes = {
  topMouseDown: 'topMouseDown',
  topMouseMove: 'topMouseMove',
  topMouseUp: 'topMouseUp',
  topScroll: 'topScroll',
  topSelectionChange: 'topSelectionChange',
  topTouchCancel: 'topTouchCancel',
  topTouchEnd: 'topTouchEnd',
  topTouchMove: 'topTouchMove',
  topTouchStart: 'topTouchStart',
};

const {ResponderEventPlugin} = createResponderEventPlugin(TopLevelTypes);

export default ResponderEventPlugin;
