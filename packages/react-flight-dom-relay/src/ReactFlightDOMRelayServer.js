/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';

import {createRequest, startWork} from 'react-server/src/ReactFlightServer';

type EncodedData = Array<string>;

function render(model: ReactModel): EncodedData {
  let data: EncodedData = [];
  let request = createRequest(model, data);
  startWork(request);
  return data;
}

export {render};
