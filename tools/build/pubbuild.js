var util = require('./util');
var Q = require('q');
var spawn = require('child_process').spawn;
var through2 = require('through2');
var path = require('path');
var glob = require('glob');
var fs = require('fs');

function buildAllWebSubdirs(gulp, plugins, config) {
  return function() {
    var webFolders = [].slice.call(glob.sync(path.join(config.src, '*/web')));
    return nextFolder();

    function nextFolder() {
      if (!webFolders.length) {
        return;
      }
      var folder = path.resolve(path.join(webFolders.shift(), '..'));
      var destFolder = path.resolve(path.join(config.dest, path.basename(folder)));

      const nextConfig = {
        command: config.command,
        dest: destFolder,
        mode: config.mode,
        src: folder
      };
      return single(nextConfig).then(function() {
        return replaceDartWithJsScripts(gulp, destFolder);
      }).then(function() {
        return removeWebFolder(gulp, destFolder);
      }).then(nextFolder);
    }
  };
}

function single(config) {
  var pubMode = config.mode || 'release';
  var pubArgs = ['build', '--mode', pubMode];
  if (config.dest) {
    pubArgs = pubArgs.concat(['-o', config.dest]);
  }

  return util.processToPromise(spawn(config.command, pubArgs, {
    stdio: 'inherit',
    cwd: config.src
  }));
}

function replaceDartWithJsScripts(gulp, folder) {
  return util.streamToPromise(gulp.src(path.join(folder, '**/*.html'))
    .pipe(through2.obj(function(file, enc, done) {
      var content = file.contents.toString();
      content = content.replace(/\.dart/, '.dart.js');
      content = content.replace(/application\/dart/, 'text/javascript');
      file.contents = new Buffer(content);
      this.push(file);
      done();
    }))
    .pipe(gulp.dest(folder)));
}

function singleWrapper(gulp, plugins, config) {
  return function() { return single(config); };
}

function removeWebFolder(gulp, folder) {
  var folders = [].slice.call(glob.sync(path.join(folder, 'web', '*')));
  folders.forEach(function(subFolder) {
    fs.renameSync(subFolder, subFolder.replace('/web/', '/'));
  });
  fs.rmdirSync(path.join(folder, 'web'));
  return Q.resolve();
}

module.exports = {
  single: singleWrapper,
  subdirs: buildAllWebSubdirs
};
