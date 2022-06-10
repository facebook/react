/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Dispatcher} from 'react-dom/ReactDOMDispatcher';

function preload() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  } else {
    console.log('no preload dispatcher');
  }
}

export {preload};
