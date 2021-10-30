/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import voidElementTags from './voidElementTags';

const HTML = '__html';

function assertValidProps(tag: string, props: ?Object) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[tag]) {
    if (props.children != null || props.dangerouslySetInnerHTML != null) {
      throw new Error(
        `${tag} is a void element tag and must neither have \`children\` nor ` +
          'use `dangerouslySetInnerHTML`.',
      );
    }
  }
  if (props.dangerouslySetInnerHTML != null) {
    if (props.children != null) {
      throw new Error(
        'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      );
    }

    if (
      typeof props.dangerouslySetInnerHTML !== 'object' ||
      !(HTML in props.dangerouslySetInnerHTML)
    ) {
      throw new Error(
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
          'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
          'for more information.',
      );
    }
  }
  if (__DEV__) {
    if (
      !props.suppressContentEditableWarning &&
      props.contentEditable &&
      props.children != null
    ) {
      console.error(
        'A component is `contentEditable` and contains `children` managed by ' +
          'React. It is now your responsibility to guarantee that none of ' +
          'those nodes are unexpectedly modified or duplicated. This is ' +
          'probably not intentional.',
      );
    }
  }

  if (props.style != null && typeof props.style !== 'object') {
    throw new Error(
      'The `style` prop expects a mapping from style properties to values, ' +
        "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
        'using JSX.',
    );
  }
}

export default assertValidProps;
