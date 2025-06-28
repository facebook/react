'use strict';

/**
 * Get leading comments from an AST path.
 * Supports both Babel and Hermes ASTs.
 */
function getComments(path) {
  const allComments = path.hub.file.ast.comments;

  if (path.node.leadingComments) {
    // Babel AST includes comments directly.
    return path.node.leadingComments;
  }

  // Hermes AST: find comments by location.
  const comments = [];
  let currentLine = path.node.loc.start.line;
  let i = allComments.length - 1;

  while (i >= 0 && allComments[i].loc.end.line >= currentLine) {
    i--;
  }

  while (i >= 0 && allComments[i].loc.end.line === currentLine - 1) {
    const comment = allComments[i];
    currentLine = comment.loc.start.line;
    comments.unshift(comment);
    i--;
  }

  return comments;
}

module.exports = getComments;
