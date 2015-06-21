'use strict';

var assign = require('object-assign');
var fs = require('fs');
var grunt = require('grunt');
var path = require('path');

var addons = {
  CSSTransitionGroup: {
    module: 'ReactCSSTransitionGroup',
    name: 'css-transition-group',
  },
  LinkedStateMixin: {
    module: 'LinkedStateMixin',
    name: 'linked-state-mixin',
  },
  PureRenderMixin: {
    module: 'ReactComponentWithPureRenderMixin',
    name: 'pure-render-mixin',
  },
  TransitionGroup: {
    module: 'ReactTransitionGroup',
    name: 'transition-group',
  },
  batchedUpdates: {
    module: 'ReactUpdates',
    method: 'batchedUpdates',
    name: 'batched-updates',
  },
  cloneWithProps: {
    module: 'cloneWithProps',
    name: 'clone-with-props',
  },
  createFragment: {
    module: 'ReactFragment',
    method: 'create',
    name: 'create-fragment',
  },
  shallowCompare: {
    module: 'shallowCompare',
    name: 'shallow-compare',
  },
  updates: {
    module: 'updates',
    name: 'updates',
  },
};

function generateSource(info) {
  var pieces = [
    "module.exports = require('react/lib/",
    info.module,
    "')",
  ];
  if (info.method) {
    pieces.push('.', info.method);
  }
  pieces.push(';');
  return pieces.join('');
}

function buildReleases() {
  var pkgTemplate = grunt.file.readJSON('./packages/react-addons/package.json');
  // var done = this.async();
  Object.keys(addons).map(function(k) {
    var info = addons[k];
    var pkgName = 'react-addons-' + info.name;
    var destDir = 'build/packages/' + pkgName;

    var pkgData = assign({}, pkgTemplate);
    pkgData.name = pkgName;

    grunt.file.mkdir(destDir);
    fs.writeFileSync(path.join(destDir, 'index.js'), generateSource(info));
    fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkgData, null, 2));

    // TODO: Make a readme. Consider using a template and sticking it in the original source directory. Also, maybe a license, patents file.
  });
  // done();
}

function packReleases() {
  var done = this.async();
  var count = 0;

  var addonKeys = Object.keys(addons);

  addonKeys.forEach(function(k) {
    var info = addons[k];
    var pkgName = 'react-addons-' + info.name;
    var pkgDir = 'build/packages/' + pkgName;

    var spawnCmd = {
      cmd: 'npm',
      args: ['pack', pkgDir],
    };
    grunt.util.spawn(spawnCmd, function() {
      var buildSrc = pkgName + '-' + grunt.config.data.pkg.version + '.tgz';
      var buildDest = 'build/packages/' + pkgName + '.tgz';
      fs.rename(buildSrc, buildDest, maybeDone);
    });
  });

  function maybeDone() {
    if (++count === addonKeys.length) {
      done();
    }
  }
}

module.exports = {
  buildReleases: buildReleases,
  packReleases: packReleases,
};
