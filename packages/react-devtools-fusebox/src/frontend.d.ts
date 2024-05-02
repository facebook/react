/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type MessagePayload =
  | null
  | string
  | number
  | boolean
  | {[key: string]: MessagePayload}
  | MessagePayload[];
export type Message = {event: string; payload?: MessagePayload};

export type WallListener = (message: Message) => void;
export type Wall = {
  listen: (fn: WallListener) => Function;
  send: (event: string, payload?: MessagePayload) => void;
};

export type Bridge = {
  shutdown: () => void;
};
export type Store = Object;
export type BrowserTheme = 'dark' | 'light';

export function createBridge(wall: Wall): Bridge;
export function createStore(bridge: Bridge): Store;

export type InitializationOptions = {
  bridge: Bridge;
  store: Store;
  theme?: BrowserTheme;
};
export function initialize(
  node: Element | Document,
  options: InitializationOptions,
): void;
