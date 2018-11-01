/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createRequest, readBuffer} from 'react-stream/inline.dom';

function render() {
  readBuffer(createRequest({}));
}
export default {
  render,
};
