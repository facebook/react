/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule assertValidProps
 */

'use strict';

var invariant = require('fbjs/lib/invariant');
var voidElementTags = require('voidElementTags');

if (__DEV__) {
  var {getCurrentFiberStackAddendum} = require('ReactDebugCurrentFiber');
  var warning = require('fbjs/lib/warning');
}

var HTML = '__html';

function getDeclarationErrorAddendum(getCurrentOwnerName) {
  if (__DEV__) {
    var ownerName = getCurrentOwnerName();
    if (ownerName) {
      // TODO: also report the stack.
      return '\n\nThis DOM node was rendered by `' + ownerName + '`.';
    }
  }
  return '';
}

function assertValidProps(
  tag: string,
  props: ?Object,
  getCurrentOwnerName: () => ?string,
) {
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
      getDeclarationErrorAddendum(getCurrentOwnerName),
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
      getCurrentFiberStackAddendum() || '',
    );
  }
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
      "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
      'using JSX.%s',
    getDeclarationErrorAddendum(getCurrentOwnerName),
  );
}

module.exports = assertValidProps;
