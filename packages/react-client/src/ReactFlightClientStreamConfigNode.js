/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {TextDecoder} from 'util';

export type StringDecoder = TextDecoder;

export function createStringDecoder(): StringDecoder {
  // $FlowFixMe[incompatible-type] flow-typed has incorrect constructor signature
  return new TextDecoder();
}

const decoderOptions: {stream?: boolean, ...} = {stream: true};

export function readPartialStringChunk(
  decoder: StringDecoder,
  buffer: Uint8Array,
): string {
  return decoder.decode(buffer, decoderOptions);
}

export function readFinalStringChunk(
  decoder: StringDecoder,
  buffer: Uint8Array,
): string {
  return decoder.decode(buffer);
}
