const visit = require('unist-util-visit');

// Always treat JS blocks as JSX.
// TODO: maybe we can just change it in Markdown in the future?
module.exports = ({markdownAST}) => {
  visit(markdownAST, `code`, node => {
    if (typeof node.lang !== 'string') {
      return;
    }
    if (node.lang.indexOf('jsx') === 0) {
      // Already JSX (with optional line range).
      return;
    }
    // Turn JS into JSX, preserving the optional line range.
    if (node.lang.indexOf('js') === 0) {
      node.lang = 'jsx' + node.lang.substring('js'.length);
    }
    if (node.lang.indexOf('javascript') === 0) {
      node.lang = 'jsx' + node.lang.substring('javascript'.length);
    }
  });
};
