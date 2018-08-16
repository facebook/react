/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type TypeOfWork =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

export const IndeterminateComponent = 0; // Before we know whether it is functional or class
export const FunctionalComponent = 1;
export const FunctionalComponentLazy = 2;
export const ClassComponent = 3;
export const ClassComponentLazy = 4;
export const HostRoot = 5; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 6; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 7;
export const HostText = 8;
export const Fragment = 9;
export const Mode = 10;
export const ContextConsumer = 11;
export const ContextProvider = 12;
export const ForwardRef = 13;
export const ForwardRefLazy = 14;
export const Profiler = 15;
export const PlaceholderComponent = 16;
