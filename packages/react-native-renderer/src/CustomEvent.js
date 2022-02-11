/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

export type CustomEventOptions = $ReadOnly<{|
    bubbles?: boolean,
    cancelable?: boolean,
    detail?: { ... }
|}>;

// TODO: should extend an Event base-class that has most of these properties
class CustomEvent extends Event {
  type: string;
  detail: ?{ ... };
  bubbles: boolean;
  cancelable: boolean;
  isTrusted: boolean;

  constructor(typeArg: string, options: CustomEventOptions) {
    const { bubbles, cancelable } = options;
    // TODO: support passing in the `composed` param
    super(typeArg, { bubbles, cancelable });

    this.detail = options.detail; // this would correspond to `NativeEvent` in SyntheticEvent

    // TODO: do we need these since they should be on Event? (for RN we probably need a polyfill)
    this.type = typeArg;
    this.bubbles = !!(bubbles || false);
    this.cancelable = !!(cancelable || false);
    this.isTrusted = false;
  }
}

export default CustomEvent;
