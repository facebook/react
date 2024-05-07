/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type MessagePayload = null | string | number | boolean | { [key: string]: MessagePayload } | MessagePayload[];
export type Message = { event: string, payload?: MessagePayload };

export type WallListener = (message: Message) => void;
export type Wall = {
  listen: (fn: WallListener) => Function,
  send: (event: string, payload?: MessagePayload) => void,
};

export type Bridge = {
  shutdown: () => void,
};
export type Store = Object;
export type BrowserTheme = 'dark' | 'light';

export function createBridge(wall: Wall): Bridge;
export function createStore(bridge: Bridge): Store;

export type Source = {
  sourceURL: string,
  line: number,
  column: number,
};
export type ViewElementSource = (
  source: Source,
  symbolicatedSource: Source | null,
) => void;
export type ViewAttributeSource = (
  id: number,
  path: Array<string | number>,
) => void;
export type CanViewElementSource = (
  source: Source,
  symbolicatedSource: Source | null,
) => boolean;

export type InitializationOptions = {
  bridge: Bridge,
  store: Store,
  theme?: BrowserTheme,
  viewAttributeSourceFunction?: ViewAttributeSource,
  viewElementSourceFunction?: ViewElementSource,
  canViewElementSourceFunction?: CanViewElementSource,
};

export function initialize(node: Element | Document, options: InitializationOptions): void;
