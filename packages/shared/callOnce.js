/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function callOnce(
  withKey: ?boolean,
): ((key: ?string) => boolean) | (() => boolean) {
  if (__DEV__) {
    let did: Object | boolean = withKey ? {} : false;
    return withKey
      ? (key: ?string): boolean => {
          if ((did: Object)[key]) return false;
          return ((did: Object)[key] = true);
        }
      : (): boolean => {
          if (did) return false;
          return (did = true);
        };
  }

  return () => false;
}

export default callOnce;
