/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function getComments(path) {
  const allComments = path.hub.file.ast.comments;

  // Check if Babel AST includes comments.
  if (path.node.leadingComments) {
    return path.node.leadingComments;
  }

  // In Hermes AST, find comments by range.
  const comments = [];
  const startLine = path.node.loc.start.line;

  // Find comments that end before or on the same line as the node.
  let i = allComments.length - 1;
  while (i >= 0 && allComments[i].loc.end.line >= startLine) {
    i--;
  }

  // Collect comments that end on the line before the node.
  while (i >= 0 && allComments[i].loc.end.line === startLine - 1) {
    startLine = allComments[i].loc.start.line;
    comments.unshift(allComments[i]);
    i--;
  }

  return comments;
}

module.exports = getComments;
