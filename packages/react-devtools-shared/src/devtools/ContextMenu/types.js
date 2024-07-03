/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Node as ReactNode, AbstractComponent, ElementRef} from 'react';

export type ContextMenuItem = {
  onClick: () => void,
  content: ReactNode,
};

// Relative to [data-react-devtools-portal-root]
export type ContextMenuPosition = {
  x: number,
  y: number,
};

export type ContextMenuHandle = {
  isShown(): boolean,
  hide(): void,
};

export type ContextMenuComponent = AbstractComponent<{}, ContextMenuHandle>;
export type ContextMenuRef = {current: ElementRef<ContextMenuComponent> | null};
