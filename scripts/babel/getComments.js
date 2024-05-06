/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function getComments(path) {
  const allComments = path.hub.file.ast.comments;
  if (path.node.leadingComments) {
    // Babel AST includes comments.
    return path.node.leadingComments;
  }
  // In Hermes AST we need to find the comments by range.
  const comments = [];
  let line = path.node.loc.start.line;

  /*
  const commentsByLine = allComments.reduce((map, comment) => {
    const line = comment.loc.end.line;
    if (!map[line]) {
      map[line] = [];
    }
    map[line].push(comment);
    return map;
  }, {});

  // Find for the comments on the line before the node.
  while (commentsByLine[line - 1]) {
    comments.unshift(...commentsByLine[line - 1]);
    line--;
  }
  */

  let i = allComments.length - 1;
  while (i >= 0 && allComments[i].loc.end.line >= line) {
    i--;
  }
  if (i >= 0) {
    let commentLine = allComments[i].loc.end.line;
    while (i >= 0 && allComments[i].loc.end.line === commentLine) {
      comments.unshift(allComments[i]);
      i--;
    }
  }
  // while (i >= 0 && allComments[i].loc.end.line === line - 1) {
  //   line = allComments[i].loc.start.line;
  //   comments.unshift(allComments[i]);
  //   i--;
  // }
  return comments;
}

module.exports = getComments;
