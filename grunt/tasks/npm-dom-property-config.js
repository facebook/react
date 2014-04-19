'use strict';

var fs = require('fs');
var grunt = require('grunt');

function npmGruntModule(opts) {
  function buildRelease() {
    // delete build/npm-dom-property-config for fresh start
    grunt.file.exists(opts.dest) && grunt.file.delete(opts.dest);

    // mkdir -p build/npm-dom-property-config/lib
    grunt.file.mkdir(opts.lib);

    // Copy npm-react/dom-property-config/**/* to build/npm-dom-property-config
    var mappings = [].concat(
      grunt.file.expandMapping('**/*', opts.dest, {cwd: opts.src})
    );
    mappings.forEach(function(mapping) {
      var src = mapping.src[0];
      var dest = mapping.dest;
      if (grunt.file.isDir(src)) {
        grunt.file.mkdir(dest);
      } else {
        grunt.file.copy(src, dest);
      }
    });

    opts.files.forEach(function (fileName) {
      grunt.file.copy(
        opts.modSrc + fileName,
        opts.lib + fileName
      )
    })

    // modify build/react-core/package.json to set version ##
    var pkg = grunt.file.readJSON(opts.dest + 'package.json');
    pkg.version = grunt.config.data.pkg.version;
    grunt.file.write(opts.dest + 'package.json', JSON.stringify(pkg, null, 2));
  }

  function packRelease() {
    /*jshint validthis:true */
    var done = this.async();
    var spawnCmd = {
      cmd: 'npm',
      args: ['pack', opts.folderName],
      opts: {
        cwd: 'build/'
      }
    };
    grunt.util.spawn(spawnCmd, function() {
      var src = 'build/' + opts.name + '-' +
          grunt.config.data.pkg.version + '.tgz';
      var dest = 'build/' + opts.name + '.tgz';
      fs.rename(src, dest, done);
    });
  }


  return {
    buildRelease: buildRelease,
    packRelease: packRelease
  };
}

module.exports = npmGruntModule({
  folderName: 'npm-dom-property-config',
  name: 'dom-property-config',
  src: 'npm-react/dom-property-config/',
  dest: 'build/npm-dom-property-config/',
  modSrc: 'build/modules/',
  lib: 'build/npm-dom-property-config/lib/',
  files: [
    'DefaultDOMPropertyConfig.js',
    'DOMPropertyInjectionConstants.js'
  ]
});
