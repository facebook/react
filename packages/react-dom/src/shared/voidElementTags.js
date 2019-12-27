/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import omittedCloseTags from './omittedCloseTags';

// For HTML, certain tags cannot have children. This has the same purpose as
// `omittedCloseTags` except that `menuitem` should still have its closing tag.

const voidElementTags = {
  menuitem: true,
  ...omittedCloseTags,
};

export default voidElementTags;
