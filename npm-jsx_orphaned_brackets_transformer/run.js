#!/usr/bin/env node

'use strict';

var FileFinder = require('node-find-files');
var fs = require('graceful-fs');
var jstransform = require('jstransform');
var path = require('path');
var visitReactTag = require('./transforms/react').visitReactTag;
/*eslint-disable no-shadow*/
var S = jstransform.Syntax;

var USAGE =
  'Read a file (or directory of files) from disk, transform any orphaned ' +
  '} and > characters to avoid parser errors with React 0.13.';

function _visitFbt(node, path, state) {
  return false;
}
_visitFbt.test = function(node, path, state) {
  return node.type === S.XJSElement
         && node.openingElement.name.name === 'fbt';
};

var VISITORS_LIST = [
  _visitFbt,
  visitReactTag,
];

function _transformSource(source) {
  return jstransform.transform(VISITORS_LIST, source).code;
}

function transformDir(dirPath, exclude) {
  var finder = new FileFinder({
    rootFolder: dirPath,
    filterFunction: function(path, stat) {
      return /\.jsx?$/.test(path) && (!exclude || !exclude.test(path));
    },
  });

  var numTransforms = 0;
  var completeTransforms = 0;
  var findingComplete = false;
  function _printProgress() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      completeTransforms + '/' + numTransforms + ' transforms complete'
    );

    if (findingComplete && completeTransforms === numTransforms) {
      console.log('\ndone!');
    }
  }

  finder.on('match', function(pathStr, stat) {
    fs.readFile(pathStr, 'utf8', function(err, data) {
      if (err) {
        err.message = err.message + ' (' + pathStr + ')';
        throw err;
      }

      numTransforms++;
      _printProgress();

      var transformedData;
      try {
        transformedData = _transformSource(data);
      } catch (e) {
        e.message = e.message + ' (' + pathStr + ')';
        throw e;
      }

      if (transformedData !== data) {
        fs.writeFile(pathStr, transformedData, function(err) {
          if (err) {
            err.message = err.message + ' (' + pathStr + ')';
            throw err;
          }
          completeTransforms++;
          _printProgress();
        });
      } else {
        completeTransforms++;
        _printProgress();
      }
    });
  });

  finder.on('error', function(err) {
    console.log('\nError: ', err.stack);
    throw err;
  });

  finder.on('complete', function() {
    findingComplete = true;
  });

  finder.startSearch();
}

function transformFile(pathStr) {
  fs.readFile(pathStr, 'utf8', function(err, data) {
    if (err) {
      err.message = err.message + ' (' + pathStr + ')';
      throw err;
    }

    var transformedData;
    try {
      transformedData = _transformSource(data);
    } catch (e) {
      e.message = e.message + ' (' + pathStr + ')';
      throw e;
    }

    if (transformedData !== data) {
      fs.writeFile(pathStr, transformedData, function(err) {
        if (err) {
          err.message = err.message + ' (' + pathStr + ')';
          throw err;
        }
        console.log('done!');
      });
    } else {
      console.log('done!');
    }
  });
}

if (require.main === module) {
  var argv = require('optimist')
    .usage(USAGE)
    .argv;

  if (argv._.length === 0) {
    throw new Error(
      'Please specify a file or directory path as the first arg!'
    );
  }

  argv._.forEach(function(arg) {
    var absPath = path.resolve(arg);

    fs.stat(absPath, function(err, stat) {
      if (err) {
        throw err;
      }

      if (stat.isFile()) {
        transformFile(absPath);
      } else if (stat.isDirectory()) {
        var exclude = null;
        if (argv.exclude) {
          exclude = new RegExp(argv.exclude);
        }
        transformDir(absPath, exclude);
      } else {
        throw new Error('Unknown filesystem node type: ' + absPath);
      }
    });
  });
}

exports.transformDir = transformDir;
