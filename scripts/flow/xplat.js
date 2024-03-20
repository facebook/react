/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare module 'ReactNativeInternalFeatureFlags' {
  declare export const alwaysThrottleDisappearingFallbacks: boolean;
  declare export const alwaysThrottleRetries: boolean;
  declare export const consoleManagedByDevToolsDuringStrictMode: boolean;
  declare export const enableAsyncActions: boolean;
  declare export const enableComponentStackLocations: boolean;
  declare export const enableDeferRootSchedulingToMicrotask: boolean;
  declare export const enableInfiniteRenderLoopDetection: boolean;
  declare export const enableRenderableContext: boolean;
  declare export const enableUnifiedSyncLane: boolean;
  declare export const enableUseRefAccessWarning: boolean;
  declare export const passChildrenWhenCloningPersistedNodes: boolean;
  declare export const useModernStrictMode: boolean;
}
