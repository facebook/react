/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableFloat} from 'shared/ReactFeatureFlags';

import {resolveDirectives} from 'react-server/src/ReactFlightDirectives';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

const ReactDOMFlightServerDispatcher = {
  prefetchDNS,
  preconnect,
  preload,
  preinit,
};

export function prepareHostDispatcher(): void {
  ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
}

// Used to distinguish these contexts from ones used in other renderers.
// E.g. this can be used to distinguish legacy renderers from this modern one.
export const isPrimaryRenderer = true;

let didWarnAsyncEnvironmentDev = false;

type TDirective<Method, Options> = {
  method: Method,
  href: string,
  options: Options,
};
export type Directive =
  | PrefetchDNSDirective
  | PreconnectDirective
  | PreloadDirective
  | PreinitDirective;
type PrefetchDNSDirective = TDirective<'prefetchDNS', void>;
type PreconnectDirective = TDirective<'preconnect', ?{crossOrigin?: string}>;
type PreloadDirective = TDirective<'preload', PreloadOptions>;
type PreinitDirective = TDirective<'preinit', PreinitOptions>;

export function prefetchDNS(href: string, options?: mixed) {
  if (enableFloat) {
    pushDirective({method: 'prefetchDNS', href, options: (options: any)});
  }
}

export function preconnect(href: string, options: ?{crossOrigin?: string}) {
  if (enableFloat) {
    pushDirective({method: 'preconnect', href, options});
  }
}

type PreloadOptions = {
  as: string,
  crossOrigin?: string,
  integrity?: string,
  type?: string,
};

export function preload(href: string, options: PreloadOptions) {
  if (enableFloat) {
    pushDirective({method: 'preload', href, options});
  }
}

type PreinitOptions = {
  as: string,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
};
export function preinit(href: string, options: PreinitOptions): void {
  if (enableFloat) {
    pushDirective({method: 'preinit', href, options});
  }
}

function pushDirective(directive: Directive): void {
  const directives = resolveDirectives();
  if (directives === null) {
    if (__DEV__) {
      if (!didWarnAsyncEnvironmentDev) {
        didWarnAsyncEnvironmentDev = true;
        console.error(
          'ReactDOM.%s(): React expected to be able to associate this call to a specific Request but cannot. It is possible that this call was invoked outside of a React component. If you are calling it from within a React component that is an async function after the first `await` then you are in an environment which does not support AsyncLocalStorage. In this kind of environment ReactDOM.%s() does not do anything when called in an async manner. Try moving this function call above the first `await` within the component or remove this call. In environments that support AsyncLocalStorage such as Node.js you can call this method anywhere in a React component even after `await` operator.',
          directive.method,
          directive.method,
        );
      }
    }
    return;
  }
  directives.push(directive);
}
