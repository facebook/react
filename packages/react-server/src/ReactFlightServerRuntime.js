/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {BlockRenderFunction} from 'react/src/ReactBlock';

import type {ModuleReference} from './ReactFlightServerConfig';

import {REACT_SERVER_BLOCK_TYPE} from 'shared/ReactSymbols';

export type ServerBlockComponent<Props, Data> =
  | [
      Symbol | number,
      ModuleReference<BlockRenderFunction<Props, Data>>,
      () => Data,
    ]
  | [Symbol | number, ModuleReference<BlockRenderFunction<Props, void>>];

opaque type ServerBlock<Props>: React$AbstractComponent<
  Props,
  null,
> = React$AbstractComponent<Props, null>;

export function serverBlock<Props, Data>(
  moduleReference: ModuleReference<BlockRenderFunction<Props, Data>>,
  loadData: () => Data,
): ServerBlock<Props> {
  const blockComponent: ServerBlockComponent<Props, Data> = [
    REACT_SERVER_BLOCK_TYPE,
    moduleReference,
    loadData,
  ];

  // $FlowFixMe: Upstream BlockComponent to Flow as a valid Node.
  return blockComponent;
}

export function serverBlockNoData<Props>(
  moduleReference: ModuleReference<BlockRenderFunction<Props, void>>,
): ServerBlock<Props> {
  const blockComponent: ServerBlockComponent<Props, void> = [
    REACT_SERVER_BLOCK_TYPE,
    moduleReference,
  ];
  // $FlowFixMe: Upstream BlockComponent to Flow as a valid Node.
  return blockComponent;
}
