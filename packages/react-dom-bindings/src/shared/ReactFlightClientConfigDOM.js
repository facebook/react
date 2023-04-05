/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This client file is in the shared folder because it applies to both SSR and browser contexts.
// It is the configuraiton of the FlightClient behavior which can run in either environment.

import type {Directive} from '../server/ReactFlightServerConfigDOM';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

export function dispatchDirective(directive: Directive): void {
  const dispatcher = ReactDOMCurrentDispatcher.current;
  if (dispatcher) {
    switch (directive.method) {
      case 'prefetchDNS':
        dispatcher.prefetchDNS(directive.href, directive.options);
        return;
      case 'preconnect':
        dispatcher.preconnect(directive.href, directive.options);
        return;
      case 'preload':
        dispatcher.preload(directive.href, directive.options);
        return;
      case 'preinit':
        dispatcher.preinit(directive.href, directive.options);
        return;
    }
  }
}
