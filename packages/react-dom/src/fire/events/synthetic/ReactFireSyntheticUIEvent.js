/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {extendSyntheticEvent, SyntheticEvent} from './ReactFireSyntheticEvent';

export const SyntheticUIEvent = extendSyntheticEvent(SyntheticEvent, {
  view: null,
  detail: null,
});
