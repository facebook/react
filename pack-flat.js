'use strict';

var fs = require('fs');

var babel = require('babel');
var umd = require('umd');

var t = babel.types;

var fileToId = function(file) {
  return file.replace(/\./g, '_');
};

var currentModule = null;
var required = null;

var renamer = new babel.Transformer('react.flat-bundle', {
  VariableDeclarator: {
    enter: function(node, parent, scope, state) {
      var init = this.get('init');
      if (init.isCallExpression() &&
          init.get('callee').isIdentifier({name: 'require'})) {
        var arg = init.get('arguments')[0];
        if (arg.isLiteral() && /^\.\/([a-z][a-z0-9.]+)/i.test(arg.node.value)) {
          var file = RegExp.$1;
          required.push(file);
          //return t.identifier(fileToId(file));
          scope.rename(node.id.name, fileToId(file));
          this.dangerouslyRemove();
        } else {
          throw new Error('bad require');
        }
      } else if (scope.getBinding(node.id.name).scope.path.isProgram()) {
        scope.rename(node.id.name, currentModule + '$$' + node.id.name);
      }
    },
  },
  FunctionDeclaration: {
    enter: function(node, parent, scope, state) {
      if (scope.getBinding(node.id.name).scope.path.isProgram()) {
        scope.rename(node.id.name, currentModule + '$$' + node.id.name);
      }
    },
  },
  MemberExpression: {
    enter: function(node, parent, scope, state) {
      if (this.matchesPattern('module.exports')) {
        return t.identifier(currentModule);
      }
    },
  },
  BinaryExpression: {
    enter: function(node, parent) {
      if (node.operator === '!==' &&
          this.get('left').isLiteral({value: 'production'}) &&
          this.get('right').matchesPattern('process.env.NODE_ENV')) {
        return t.literal(false);
      }
    },
  },
  CallExpression: {
    enter: function() {
      if (this.get('callee').isIdentifier({name: 'require'})) {
        throw new Error('bad require');
      }
    },
  },
});

var stack = [];
var printedModules = {};
var process = function(file) {
  var source = fs.readFileSync('build/modules/' + file + '.js', 'utf-8');
  var id = fileToId(file);

  currentModule = id;
  required = [];

  if (stack.indexOf(file) !== -1) {
    throw new Error('circular dep: ' + stack.concat([file]));
  }
  stack.push(file);
  var transformed = babel.transform(source, {
    whitelist: [],
    plugins: [renamer],
    filename: file,
  });

  required.forEach(function(req) {
    if (Object.prototype.hasOwnProperty.call(printedModules, req)) {
      return;
    }
    process(req);
  });
  stack.pop();

  console.log('var ' + id + ';');
  console.log(transformed.code);
  printedModules[file] = true;
};

console.log(umd.prelude('React'));
console.log('return (function() {"use strict";');
process('React');
console.log('return React;');
console.log('})();');
console.log(umd.postlude('React'));
