/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DevToolsHook, ReactRenderer, RendererInterface} from '../types';

import {
  patchConsoleUsingWindowValues,
  registerRenderer as registerRendererWithConsole,
} from '../console';

export function attach(
  hook: DevToolsHook,
  rendererID: number,
  renderer: ReactRenderer,
  global: Object,
): RendererInterface {
  patchConsoleUsingWindowValues();
  registerRendererWithConsole(renderer);

  return {
    cleanup() {},
    clearErrorsAndWarnings() {},
    clearErrorsForElementID() {},
    clearWarningsForElementID() {},
    getSerializedElementValueByPath() {},
    deletePath() {},
    findHostInstancesForElementID() {
      return null;
    },
    flushInitialOperations() {},
    getBestMatchForTrackedPath() {
      return null;
    },
    getDisplayNameForElementID() {
      return null;
    },
    getNearestMountedDOMNode() {
      return null;
    },
    getElementIDForHostInstance() {
      return null;
    },
    getInstanceAndStyle() {
      return {
        instance: null,
        style: null,
      };
    },
    getOwnersList() {
      return null;
    },
    getPathForElement() {
      return null;
    },
    getProfilingData() {
      throw new Error('getProfilingData not supported by this renderer');
    },
    handleCommitFiberRoot() {},
    handleCommitFiberUnmount() {},
    handlePostCommitFiberRoot() {},
    hasElementWithId() {
      return false;
    },
    inspectElement(
      requestID: number,
      id: number,
      path: Array<string | number> | null,
    ) {
      return {
        id,
        responseID: requestID,
        type: 'not-found',
      };
    },
    logElementToConsole() {},
    patchConsoleForStrictMode() {},
    getElementAttributeByPath() {},
    getElementSourceFunctionById() {},
    overrideError() {},
    overrideSuspense() {},
    overrideValueAtPath() {},
    renamePath() {},
    renderer,
    setTraceUpdatesEnabled() {},
    setTrackedPath() {},
    startProfiling() {},
    stopProfiling() {},
    storeAsGlobal() {},
    unpatchConsoleForStrictMode() {},
    updateComponentFilters() {},
    getEnvironmentNames() {
      return [];
    },
  };
}
