/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file is an intermediate layer to translate between Flight
// calls to stream output.

import type {Destination as DestinationT} from './ReactServerStreamConfig';

export type Destination = DestinationT;

export {
  scheduleWork,
  flushBuffered,
  beginWriting,
  writeChunk,
  completeWriting,
  close,
  convertStringToBuffer,
} from './ReactServerStreamConfig';
