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
    throw new Error(
      `${'prefetchDNS'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preconnect() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preconnect.apply(this, arguments);
  } else {
    throw new Error(
      `${'preconnect'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function prefetch() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.prefetch.apply(this, arguments);
  } else {
    throw new Error(
      `${'prefetch'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preload() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  } else {
    throw new Error(
      `${'preload'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preinit() {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preinit.apply(this, arguments);
  } else {
    throw new Error(
      `${'preinit'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

export {prefetchDNS, preconnect, prefetch, preload, preinit};
