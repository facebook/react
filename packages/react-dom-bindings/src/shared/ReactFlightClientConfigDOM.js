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

import type {HintModel} from '../server/ReactFlightServerConfigDOM';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

export function dispatchHint(code: string, model: HintModel): void {
  const dispatcher = ReactDOMCurrentDispatcher.current;
  if (dispatcher) {
    let href, options;
    if (typeof model === 'string') {
      href = model;
    } else {
      href = model[0];
      options = model[1];
    }
    switch (code) {
      case 'D': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        dispatcher.prefetchDNS(href, options);
        return;
      }
      case 'C': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        dispatcher.preconnect(href, options);
        return;
      }
      case 'L': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preload(href, options);
        return;
      }
      case 'm': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preloadModule(href, options);
        return;
      }
      case 'I': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preinit(href, options);
        return;
      }
      case 'M': {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preinitModule(href, options);
        return;
      }
    }
  }
}
