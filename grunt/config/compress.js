'use strict';

var grunt = require('grunt');

var version = grunt.config.data.pkg.version;

module.exports = {
  starter: {
    options: {
      archive: './build/react-' + version + '.zip',
    },
    files: [
      {cwd: './build/starter', src: ['**'], dot: true, dest: 'react-' + version + '/'},
    ],
  },
};
