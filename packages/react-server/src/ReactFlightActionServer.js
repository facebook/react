/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable, ReactFormState} from 'shared/ReactTypes';

import type {
  ServerManifest,
  ClientReference as ServerReference,
} from 'react-client/src/ReactFlightClientConfig';

import {
  resolveServerReference,
  preloadModule,
  requireModule,
} from 'react-client/src/ReactFlightClientConfig';

import {createResponse, close, getRoot} from './ReactFlightReplyServer';

type ServerReferenceId = any;

function bindArgs(fn: any, args: any) {
  return fn.bind.apply(fn, [null].concat(args));
}

function loadServerReference<T>(
  bundlerConfig: ServerManifest,
  id: ServerReferenceId,
  bound: null | Thenable<Array<any>>,
): Promise<T> {
  const serverReference: ServerReference<T> =
    resolveServerReference<$FlowFixMe>(bundlerConfig, id);
  // We expect most servers to not really need this because you'd just have all
  // the relevant modules already loaded but it allows for lazy loading of code
  // if needed.
  const preloadPromise = preloadModule(serverReference);
  if (bound) {
    return Promise.all([(bound: any), preloadPromise]).then(
      ([args]: Array<any>) => bindArgs(requireModule(serverReference), args),
    );
  } else if (preloadPromise) {
    return Promise.resolve(preloadPromise).then(() =>
      requireModule(serverReference),
    );
  } else {
    // Synchronously available
    return Promise.resolve(requireModule(serverReference));
  }
}

export function decodeAction<T>(
  body: FormData,
  serverManifest: ServerManifest,
): Promise<() => T> | null {
  // We're going to create a new formData object that holds all the fields except
  // the implementation details of the action data.
  const formData = new FormData();

  let action: Promise<(formData: FormData) => T> | null = null;

  // $FlowFixMe[prop-missing]
  body.forEach((value: string | File, key: string) => {
    if (!key.startsWith('$ACTION_')) {
      formData.append(key, value);
      return;
    }
    // Later actions may override earlier actions if a button is used to override the default
    // form action.
    if (key.startsWith('$ACTION_REF_')) {
      const formFieldPrefix = '$ACTION_' + key.slice(12) + ':';
      // The data for this reference is encoded in multiple fields under this prefix.
      const actionResponse = createResponse(
        serverManifest,
        formFieldPrefix,
        body,
      );
      close(actionResponse);
      const refPromise = getRoot<{
        id: ServerReferenceId,
        bound: null | Promise<Array<any>>,
      }>(actionResponse);
      // Force it to initialize
      // $FlowFixMe
      refPromise.then(() => {});
      if (refPromise.status !== 'fulfilled') {
        // $FlowFixMe
        throw refPromise.reason;
      }
      const metaData = refPromise.value;
      action = loadServerReference(serverManifest, metaData.id, metaData.bound);
      return;
    }
    if (key.startsWith('$ACTION_ID_')) {
      const id = key.slice(11);
      action = loadServerReference(serverManifest, id, null);
      return;
    }
  });

  if (action === null) {
    return null;
  }
  // Return the action with the remaining FormData bound to the first argument.
  return action.then(fn => fn.bind(null, formData));
}

// TODO: Should this be an async function to preserve the option in the future
// to do async stuff in here? Would also make it consistent with decodeAction
export function decodeFormState<S>(
  actionResult: S,
  body: FormData,
  serverManifest: ServerManifest,
): ReactFormState<S> | null {
  const keyPath = body.get('$ACTION_KEY');
  if (typeof keyPath !== 'string') {
    // This form submission did not include any form state.
    return null;
  }
  return [actionResult, keyPath];
}
