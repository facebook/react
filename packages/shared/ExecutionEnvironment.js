/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const canUseDOM: boolean = !!(
  // eslint-disable-next-line react-internal/no-raw-global-usage
  (
    typeof window !== 'undefined' &&
    // eslint-disable-next-line react-internal/no-raw-global-usage
    typeof window.document !== 'undefined' &&
    // eslint-disable-next-line react-internal/no-raw-global-usage
    typeof window.document.createElement !== 'undefined'
  )
);
