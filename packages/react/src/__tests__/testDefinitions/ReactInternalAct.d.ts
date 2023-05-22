/*!
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TypeScript Definition File for React.
 *
 * Full type definitions are not yet officially supported. These are mostly
 * just helpers for the unit test.
 */

declare module 'jest-react' {
  export function act(cb : () => any) : any
}
