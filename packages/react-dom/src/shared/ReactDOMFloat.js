/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Dispatcher} from 'react-dom/ReactDOMDispatcher';

function prefetchDNS() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.prefetchDNS.apply(this, arguments);
  } else {
    console.log('no prefetchDNS dispatcher');
  }
}

function preconnect() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preconnect.apply(this, arguments);
  } else {
    console.log('no preconnect dispatcher');
  }
}

function prefetch() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.prefetch.apply(this, arguments);
  } else {
    console.log('no prefetch dispatcher');
  }
}

function preload() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  } else {
    console.log('no preload dispatcher');
  }
}

function preinit() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preinit.apply(this, arguments);
  } else {
    console.log('no preinit dispatcher');
  }
}

export {prefetchDNS, preconnect, prefetch, preload, preinit};
