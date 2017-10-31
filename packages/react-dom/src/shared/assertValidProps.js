/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

import voidElementTags from './voidElementTags';

var HTML = '__html';

function assertValidProps(tag: string, props: ?Object, getStack: () => string) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[tag]) {
    invariant(
      props.children == null && props.dangerouslySetInnerHTML == null,
      '%s is a void element tag and must neither have `children` nor ' +
        'use `dangerouslySetInnerHTML`.%s',
      tag,
      getStack(),
    );
  }
  if (props.dangerouslySetInnerHTML != null) {
    invariant(
      props.children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    );
    invariant(
      typeof props.dangerouslySetInnerHTML === 'object' &&
        HTML in props.dangerouslySetInnerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
        'for more information.',
    );
  }
  if (__DEV__) {
    warning(
      props.suppressContentEditableWarning ||
        !props.contentEditable ||
        props.children == null,
      'A component is `contentEditable` and contains `children` managed by ' +
        'React. It is now your responsibility to guarantee that none of ' +
        'those nodes are unexpectedly modified or duplicated. This is ' +
        'probably not intentional.%s',
      getStack(),
    );
  }
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
      "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
      'using JSX.%s',
    getStack(),
  );
}

export default assertValidProps;
