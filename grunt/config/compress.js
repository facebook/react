'use strict';

var grunt = require('grunt');

var version = grunt.config.data.pkg.version;

module.exports = {
  starter: {
    options: {
      archive: './build/react-' + version + '.zip'
    },
    files: [
      {cwd: './build/starter', src: ['**', '!examples/wrapup/**'], dest: 'react-' + version + '/'}
    ]
  }
};