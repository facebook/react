'use strict';

var fs = require('fs');
var grunt = require('grunt');
var path = require('path');

var addons = {
  CSSTransitionGroup: {
    peerDependency: 'react',
    module: 'ReactCSSTransitionGroup',
    name: 'css-transition-group',
    docs: 'animation',
  },
  LinkedStateMixin: {
    peerDependency: 'react',
    module: 'LinkedStateMixin',
    name: 'linked-state-mixin',
    docs: 'two-way-binding-helpers',
  },
  Perf: {
    peerDependency: 'react-dom',
    module: 'ReactPerf',
    name: 'perf',
    docs: 'perf',
  },
  PureRenderMixin: {
    peerDependency: 'react',
    module: 'ReactComponentWithPureRenderMixin',
    name: 'pure-render-mixin',
    docs: 'pure-render-mixin',
  },
  TestUtils: {
    peerDependency: 'react-dom',
    module: 'ReactTestUtils',
    name: 'test-utils',
    docs: 'test-utils',
  },
  TransitionGroup: {
    peerDependency: 'react',
    module: 'ReactTransitionGroup',
    name: 'transition-group',
    docs: 'animation',
  },
  createFragment: {
    peerDependency: 'react',
    module: 'ReactFragment',
    method: 'create',
    name: 'create-fragment',
    docs: 'create-fragment',
  },
  shallowCompare: {
    peerDependency: 'react',
    module: 'shallowCompare',
    name: 'shallow-compare',
    docs: 'shallow-compare',
  },
  updates: {
    peerDependency: 'react',
    module: 'update',
    name: 'update',
    docs: 'update',
  },
};

function generateSource(info) {
  var pieces = [
    'module.exports = require(\'',
    info.peerDependency,
    '/lib/',
    info.module,
    '\')',
  ];
  if (info.method) {
    pieces.push('.', info.method);
  }
  pieces.push(';');
  return pieces.join('');
}

function buildReleases() {
  var pkgTemplate = grunt.file.readJSON('./packages/react-addons/package.json');

  Object.keys(addons).map(function(k) {
    var info = addons[k];
    var pkgName = 'react-addons-' + info.name;
    var destDir = 'build/packages/' + pkgName;
    var destLicense = path.join(destDir, 'LICENSE');
    var destPatents = path.join(destDir, 'PATENTS');

    var pkgData = Object.assign({}, pkgTemplate);
    pkgData.name = pkgName;

    var version = pkgTemplate.peerDependencies.react;
    if (info.peerDependency !== 'react') {
      pkgData.peerDependencies = {};
      pkgData.peerDependencies[info.peerDependency] = version;
    }

    grunt.file.mkdir(destDir);
    var link = info.docs ? info.docs : 'addons';
    link = `https://facebook.github.io/react/docs/${link}.html`;
    fs.writeFileSync(path.join(destDir, 'index.js'), generateSource(info));
    fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkgData, null, 2));
    grunt.file.copy('LICENSE', destLicense);
    grunt.file.copy('PATENTS', destPatents);
    fs.writeFileSync(
      path.join(destDir, 'README.md'),
      `
# ${pkgName}

This package provides the React ${k} add-on.

See <${link}> for more information.`.slice(1)
    );
  });

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
