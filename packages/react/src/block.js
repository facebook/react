/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_BLOCK_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
} from 'shared/ReactSymbols';

type BlockQueryFunction<Args: Iterable<any>, Data> = (...args: Args) => Data;
type BlockRenderFunction<Props, Data> = (
  props: Props,
  data: Data,
) => React$Node;

type Thenable<T, R> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): R,
};

type Initializer<Props, Payload, Data> = (
  payload: Payload,
) =>
  | [Data, BlockRenderFunction<Props, Data>]
  | Thenable<[Data, BlockRenderFunction<Props, Data>], mixed>;

export type UninitializedBlockComponent<Props, Payload, Data> = {
  $$typeof: Symbol | number,
  _status: -1,
  _data: Payload,
  _fn: Initializer<Props, Payload, Data>,
};

export type PendingBlockComponent<Props, Data> = {
  $$typeof: Symbol | number,
  _status: 0,
  _data: Thenable<[Data, BlockRenderFunction<Props, Data>], mixed>,
  _fn: null,
};

export type ResolvedBlockComponent<Props, Data> = {
  $$typeof: Symbol | number,
  _status: 1,
  _data: Data,
  _fn: BlockRenderFunction<Props, Data>,
};

export type RejectedBlockComponent = {
  $$typeof: Symbol | number,
  _status: 2,
  _data: mixed,
  _fn: null,
};

export type BlockComponent<Props, Payload, Data> =
  | UninitializedBlockComponent<Props, Payload, Data>
  | PendingBlockComponent<Props, Data>
  | ResolvedBlockComponent<Props, Data>
  | RejectedBlockComponent;

opaque type Block<Props>: React$AbstractComponent<
  Props,
  null,
> = React$AbstractComponent<Props, null>;

export default function block<Args: Iterable<any>, Props, Data>(
  query: BlockQueryFunction<Args, Data>,
  render: BlockRenderFunction<Props, Data>,
): (...args: Args) => Block<Props> {
  if (__DEV__) {
    if (typeof query !== 'function') {
      console.error(
        'Blocks require a query function but was given %s.',
        query === null ? 'null' : typeof query,
      );
    }
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      console.error(
        'Blocks require a render function but received a `memo` ' +
          'component. Use `memo` on an inner component instead.',
      );
    } else if (render != null && render.$$typeof === REACT_FORWARD_REF_TYPE) {
      console.error(
        'Blocks require a render function but received a `forwardRef` ' +
          'component. Use `forwardRef` on an inner component instead.',
      );
    } else if (typeof render !== 'function') {
      console.error(
        'Blocks require a render function but was given %s.',
        render === null ? 'null' : typeof render,
      );
    } else if (render.length !== 0 && render.length !== 2) {
      // Warn if it's not accepting two args.
      // Do not warn for 0 arguments because it could be due to usage of the 'arguments' object
      console.error(
        'Block render functions accept exactly two parameters: props and data. %s',
        render.length === 1
          ? 'Did you forget to use the data parameter?'
          : 'Any additional parameter will be undefined.',
      );
    }

    if (
      render != null &&
      (render.defaultProps != null || render.propTypes != null)
    ) {
      console.error(
        'Block render functions do not support propTypes or defaultProps. ' +
          'Did you accidentally pass a React component?',
      );
    }
  }
  function initializer(args) {
    let data = query.apply(null, args);
    return [data, render];
  }
  return function(): Block<Props> {
    let args: Args = arguments;
    let blockComponent: UninitializedBlockComponent<Props, Args, Data> = {
      $$typeof: REACT_BLOCK_TYPE,
      _status: -1,
      _data: args,
      _fn: initializer,
    };
    // $FlowFixMe
    return blockComponent;
  };
}
