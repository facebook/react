'use strict';
/*eslint-disable camelcase*/
module.exports = {

  react_docs: {
    files: [
      {
        src: ['react.js', 'JSXTransformer.js'],
        dest: 'docs/js/',
        cwd: 'build/',
        expand: true
      }
    ]
  }

};
