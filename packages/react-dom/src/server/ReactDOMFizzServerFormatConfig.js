/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {convertStringToBuffer} from 'react-stream/src/ReactFizzHostConfig';

export function formatChunk(type: string, props: Object): Uint8Array {
  let str = '<' + type + '>';
  if (typeof props.children === 'string') {
    str += props.children;
  }
  str += '</' + type + '>';
  return convertStringToBuffer(str);
}
