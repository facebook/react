/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type HostContext = Object;

export type TextInstance = {
  text: string,
  id: number,
  parent: number,
  hidden: boolean,
  context: HostContext,
};

export type Instance = {
  type: string,
  id: number,
  parent: number,
  children: Array<Instance | TextInstance>,
  text: string | null,
  prop: any,
  hidden: boolean,
  context: HostContext,
};

export type PublicInstance = Instance;

export type TransitionStatus = mixed;
