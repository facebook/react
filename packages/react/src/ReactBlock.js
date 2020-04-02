/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from './ReactLazy';

import {
  REACT_LAZY_TYPE,
  REACT_BLOCK_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
} from 'shared/ReactSymbols';

type BlockLoadFunction<Args: Iterable<any>, Data> = (...args: Args) => Data;
export type BlockRenderFunction<Props, Data> = (
  props: Props,
  data: Data,
) => React$Node;

type Payload<Props, Args: Iterable<any>, Data> = {
  load: BlockLoadFunction<Args, Data>,
  args: Args,
  render: BlockRenderFunction<Props, Data>,
};

export type BlockComponent<Props, Data> = {
  $$typeof: Symbol | number,
  _data: Data,
  _render: BlockRenderFunction<Props, Data>,
};

opaque type Block<Props>: React$AbstractComponent<
  Props,
  null,
> = React$AbstractComponent<Props, null>;

function lazyInitializer<Props, Args: Iterable<any>, Data>(
  payload: Payload<Props, Args, Data>,
): BlockComponent<Props, Data> {
  return {
    $$typeof: REACT_BLOCK_TYPE,
    _data: payload.load.apply(null, payload.args),
    _render: payload.render,
  };
}

export function block<Args: Iterable<any>, Props, Data>(
  render: BlockRenderFunction<Props, Data>,
  load?: BlockLoadFunction<Args, Data>,
): (...args: Args) => Block<Props> {
  if (__DEV__) {
    if (load !== undefined && typeof load !== 'function') {
      console.error(
        'Blocks require a load function, if provided, but was given %s.',
        load === null ? 'null' : typeof load,
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
      // Do not warn for 0 arguments because it could be due to usage of the 'arguments' object.
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

  if (load === undefined) {
    return function(): Block<Props> {
      const blockComponent: BlockComponent<Props, void> = {
        $$typeof: REACT_BLOCK_TYPE,
        _data: undefined,
        // $FlowFixMe: Data must be void in this scenario.
        _render: render,
      };

      // $FlowFixMe: Upstream BlockComponent to Flow as a valid Node.
      return blockComponent;
    };
  }

  // Trick to let Flow refine this.
  const loadFn = load;

  return function(): Block<Props> {
    const args: Args = arguments;

    const payload: Payload<Props, Args, Data> = {
      load: loadFn,
      args: args,
      render: render,
    };

    const lazyType: LazyComponent<
      BlockComponent<Props, Data>,
      Payload<Props, Args, Data>,
    > = {
      $$typeof: REACT_LAZY_TYPE,
      _payload: payload,
      _init: lazyInitializer,
    };

    // $FlowFixMe: Upstream BlockComponent to Flow as a valid Node.
    return lazyType;
  };
}
