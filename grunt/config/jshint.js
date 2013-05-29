'use strict';

module.exports = {
  src: {
    options: {
      jshintrc: './src/.jshintrc'
    },
    files: {
      // We don't care about src/vendor (we shouldn't be touching this), and
      // tests often use JSX, which JSHint can't handle.
      src: [
        './src/**/*.js',
        '!./src/vendor/**',
        '!./src/**/__tests__/**',
        '!./src/test/**'
      ]
    }
  },
  project: {
    options: {
      jshintrc: './.jshintrc'
    },
    files: {
      src: ['./Gruntfile.js', './grunt/**/*.js', './bin/*.js', './vendor/*.js']
    }
  }
};
