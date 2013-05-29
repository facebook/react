'use strict';

module.exports = {

  react_docs: {
    files: [
      {
        src: ['react.min.js', 'JSXTransformer.js'],
        dest: 'docs/js/',
        cwd: 'build/',
        expand: true
      }
    ]
  }

};
