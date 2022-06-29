/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Internals} from '../client/ReactDOM';

function prefetchDNS() {
  const dispatcher = Internals.floatDispatcher.current;
  if (dispatcher) {
    dispatcher.prefetchDNS.apply(this, arguments);
  } else {
    throw new Error(
      `${'prefetchDNS'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preconnect() {
  const dispatcher = Internals.floatDispatcher.current;
  if (dispatcher) {
    dispatcher.preconnect.apply(this, arguments);
  } else {
    throw new Error(
      `${'preconnect'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function prefetch() {
  const dispatcher = Internals.floatDispatcher.current;
  if (dispatcher) {
    dispatcher.prefetch.apply(this, arguments);
  } else {
    throw new Error(
      `${'prefetch'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preload() {
  const dispatcher = Internals.floatDispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  } else {
    throw new Error(
      `${'preload'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

function preinit() {
  const dispatcher = Internals.floatDispatcher.current;
  if (dispatcher) {
    dispatcher.preinit.apply(this, arguments);
  } else {
    throw new Error(
      `${'preinit'} was called while no react-dom dispatcher exists. If you called this method outside of rendering refactor your code to call it while rendering. If it was called while React was rendering this is a bug in React.`,
    );
  }
}

export {prefetchDNS, preconnect, prefetch, preload, preinit};
