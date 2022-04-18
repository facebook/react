/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';

let didWarnMutedDefaultMuted = false;

type VideoWithWrapperState = HTMLVideoElement & {|
  _wrapperState: {|initialMuted: boolean|},
|};

/**
 * Implements a <video> host component that allows optionally setting the
 * props `muted` and `defaultMuted`.
 *
 * If `defaultMuted` (not false) is provided, video will be muted on the first mount.
 */

export function getHostProps(element: Element, props: Object) {
  if (__DEV__) {
    if (props.dangerouslySetInnerHTML != null) {
      throw new Error(
        '`dangerouslySetInnerHTML` does not make sense on <video>.',
      );
    }
  }

  const hostProps = {
    ...props,
    muted: undefined,
  };

  return hostProps;
}

export function initWrapperState(element: Element, props: Object) {
  const node = ((element: any): VideoWithWrapperState);
  if (__DEV__) {
    if (
      props.muted !== undefined &&
      props.defaultMuted !== undefined &&
      !didWarnMutedDefaultMuted
    ) {
      console.error(
        '%s contains a media element with both muted and defaultMuted props. ' +
          '(specify either the muted prop, or the defaultMuted prop, but not ' +
          'both).',
        getCurrentFiberOwnerNameInDevOrNull() || 'A component',
      );
      didWarnMutedDefaultMuted = true;
    }
  }

  const muted = props.muted;

  node._wrapperState = {
    initialMuted: muted != null ? muted : !!props.defaultMuted,
  };
}

export function postMountWrapper(element: Element, props: Object) {
  const node = ((element: any): VideoWithWrapperState);
  // This is in postMount because we need access to the DOM node, which is not
  // available until after the component has mounted.

  if (props.defaultMuted != null || props.muted == null) {
    const muted = node._wrapperState.initialMuted;
    node.muted = muted;
  }
}
