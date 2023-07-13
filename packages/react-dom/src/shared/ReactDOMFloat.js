/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  PreconnectOptions,
  PreloadOptions,
  PreinitOptions,
} from './ReactDOMTypes';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const Dispatcher = ReactDOMSharedInternals.Dispatcher;

export function prefetchDNS(href: string) {
  let passedOptionArg: any;
  if (__DEV__) {
    if (arguments[1] !== undefined) {
      passedOptionArg = arguments[1];
    }
  }
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    if (__DEV__) {
      if (passedOptionArg !== undefined) {
        // prefetchDNS will warn if you pass reserved options arg. We pass it along in Dev only to
        // elicit the warning. In prod we do not forward since it is not a part of the interface.
        // @TODO move all arg validation into this file. It needs to be universal anyway so may as well lock down the interace here and
        // let the rest of the codebase trust the types
        dispatcher.prefetchDNS(href, passedOptionArg);
      } else {
        dispatcher.prefetchDNS(href);
      }
    } else {
      dispatcher.prefetchDNS(href);
    }
  }
  // We don't error because preconnect needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preconnect(href: string, options?: ?PreconnectOptions) {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preconnect(href, options);
  }
  // We don't error because preconnect needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preload(href: string, options: PreloadOptions) {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload(href, options);
  }
  // We don't error because preload needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preinit(href: string, options: PreinitOptions) {
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    dispatcher.preinit(href, options);
  }
  // We don't error because preinit needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}
