/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  REACT_BLOCK_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
} from 'shared/ReactSymbols';

opaque type Block<Props>: React$AbstractComponent<
  Props,
  null,
> = React$AbstractComponent<Props, null>;

export default function block<Args, Props, Data>(
  query: (...args: Args) => Data,
  render: (props: Props, data: Data) => React$Node,
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
  return function(): Block<Props> {
    let args = arguments;
    return {
      $$typeof: REACT_BLOCK_TYPE,
      query: function() {
        return query.apply(null, args);
      },
      render: render,
    };
  };
}
