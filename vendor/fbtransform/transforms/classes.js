/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global exports:true*/
"use strict";

/**
 * Desugarizer for ES6 minimal class proposal. See
 * http://wiki.ecmascript.org/doku.php?id=harmony:proposals
 *
 * Does not require any runtime. Preserves whitespace and comments.
 * Supports a class declaration with methods, super calls and inheritance.
 * Currently does not support for getters and setters, since there's a very
 * low probability we're going to use them anytime soon.
 *
 * Additional features:
 * - Any member with private name (the name with prefix _, such _name) inside
 *   the class's scope will be munged. This would will to eliminate the case
 *   of sub-class accidentally overriding the super-class's provate properties
 *   also discouage people from accessing private members that they should not
 *   access. However, quoted property names don't get munged.
 *
 * class SkinnedMesh extends require('THREE').Mesh {
 *
 *   update(camera) {
 *     camera.code = 'iphone'
 *     super.update(camera);
 *   }
 *
 *   /
 *    * @constructor
 *    /
 *   constructor(geometry, materials) {
 *     super(geometry, materials);
 *
 *     super.update(1);
 *
 *     this.identityMatrix = new THREE.Matrix4();
 *     this.bones = [];
 *     this.boneMatrices = [];
 *     this._name = 'foo';
 *   }
 *
 *   /
 *    * some other code
 *    /
 *   readMore() {
 *
 *   }
 *
 *   _doSomething() {
 *
 *   }
 * }
 *
 * should be converted to
 *
 * var SkinnedMesh = (function() {
 *   var __super = require('parent').Mesh;
 *
 *   /
 *    * @constructor
 *    /
 *   function SkinnedMesh(geometry, materials) {
 *     __super.call(this, geometry, materials);
 *
 *     __super.prototype.update.call(this, 1);
 *
 *     this.identityMatrix = new THREE.Matrix4();
 *     this.bones = [];
 *     this.boneMatrices = [];
 *     this.$SkinnedMesh_name = 'foo';
 *   }
 *   SkinnedMesh.prototype = Object.create(__super.prototype);
 *   SkinnedMesh.prototype.constructor = SkinnedMesh;
 *
 *   /
 *    * @param camera
 *    /
 *   SkinnedMesh.prototype.update = function(camera) {
 *     camera.code = 'iphone'
 *     __super.prototype.update.call(this, camera);
 *   };
 *
 *   SkinnedMesh.prototype.readMore = function() {
 *
 *   };
 *
 *   SkinnedMesh.prototype.$SkinnedMesh_doSomething = function() {
 *
 *   };
 *
 *   return SkinnedMesh;
 * })();
 *
 */
var Syntax = require('esprima').Syntax;
var base62 = require('base62');

var catchup = require('../lib/utils').catchup;
var append = require('../lib/utils').append;
var move = require('../lib/utils').move;
var indentBefore = require('../lib/utils').indentBefore;
var updateIndent = require('../lib/utils').updateIndent;
var updateState = require('../lib/utils').updateState;

function findConstructorIndex(object) {
  var classElements = object.body && object.body.body || [];
  for (var i = 0; i < classElements.length; i++) {
    if (classElements[i].type === Syntax.MethodDefinition &&
      classElements[i].key.name === 'constructor') {
      return i;
    }
  }
  return -1;
}

var _mungedSymbolMaps = {};
function getMungedName(scopeName, name, minify) {
  if (minify) {
    if (!_mungedSymbolMaps[scopeName]) {
      _mungedSymbolMaps[scopeName] = {
        symbolMap: {},
        identifierUUIDCounter: 0
      };
    }

    var symbolMap = _mungedSymbolMaps[scopeName].symbolMap;
    if (!symbolMap[name]) {
      symbolMap[name] =
        base62.encode(_mungedSymbolMaps[scopeName].identifierUUIDCounter);
      _mungedSymbolMaps[scopeName].identifierUUIDCounter++;
    }
    name = symbolMap[name];
  }
  return '$' + scopeName + name;
}

function shouldMungeName(scopeName, name, state) {
  // only run when @preventMunge is not present in the docblock
  if (state.g.preventMunge === undefined) {
    var docblock = require('../lib/docblock');
    state.g.preventMunge = docblock.parseAsObject(
      docblock.extract(state.g.source)).preventMunge !== undefined;
  }
  // Starts with only a single underscore (i.e. don't count double-underscores)
  return !state.g.preventMunge && scopeName ? /^_(?!_)/.test(name) : false;
}


function getProtoOfPrototypeVariableName(superVar) {
  return superVar + 'ProtoOfPrototype';
}

function getSuperKeyName(superVar) {
  return superVar + 'Key';
}

function getSuperProtoOfPrototypeVariable(superVariableName, indent) {
  var string = (indent +
    'var $proto = $superName && $superName.prototype ? ' +
    '$superName.prototype : $superName;\n'
  ).replace(/\$proto/g, getProtoOfPrototypeVariableName(superVariableName))
   .replace(/\$superName/g, superVariableName);
   return string;
}


function getInheritanceSetup(superClassToken, className, indent, superName) {
  var string = '';
  if (superClassToken) {
    string += getStaticMethodsOnConstructorSetup(className, indent, superName);
    string += getPrototypeOnConstructorSetup(className, indent, superName);
    string += getConstructorPropertySetup(className, indent);
  }
  return string;
}

function getStaticMethodsOnConstructorSetup(className, indent, superName) {
  var string = ( indent +
    'for (var $keyName in $superName) {\n' + indent +
    '  if ($superName.hasOwnProperty($keyName)) {\n' + indent +
    '    $className[$keyName] = $superName[$keyName];\n' + indent +
    '  }\n' + indent +
    '}\n')
    .replace(/\$className/g, className)
    .replace(/\$keyName/g, getSuperKeyName(superName))
    .replace(/\$superName/g, superName);
  return string;
}

function getPrototypeOnConstructorSetup(className, indent, superName) {
  var string = ( indent +
    '$className.prototype = Object.create($protoPrototype);\n')
    .replace(/\$protoPrototype/g, getProtoOfPrototypeVariableName(superName))
    .replace(/\$className/g, className);
  return string;
}

function getConstructorPropertySetup(className, indent) {
  var string = ( indent +
    '$className.prototype.constructor = $className;\n')
    .replace(/\$className/g, className);

  return string;
}

function getSuperConstructorSetup(superClassToken, indent, superName) {
  if (!superClassToken) return '';
  var string = ( '\n' + indent +
    '  if ($superName && $superName.prototype) {\n' + indent +
    '    $superName.apply(this, arguments);\n' + indent +
    '  }\n' + indent)
    .replace(/\$superName/g, superName);
  return string;
}

function getMemberFunctionCall(superVar, propertyName, superArgs) {
  var string = (
    '$superPrototype.$propertyName.call($superArguments)')
  .replace(/\$superPrototype/g, getProtoOfPrototypeVariableName(superVar))
  .replace(/\$propertyName/g, propertyName)
  .replace(/\$superArguments/g, superArgs);
  return string;
}

function getCallParams(classElement, state) {
  var params = classElement.value.params;
  if (!params.length) {
    return '';
  }
  return state.g.source.substring(
    params[0].range[0],
    params[params.length - 1].range[1]);
}

function getSuperArguments(callExpression, state) {
  var args = callExpression.arguments;
  if (!args.length) {
    return 'this';
  }
  return 'this, ' + state.g.source.substring(
    args[0].range[0],
    args[args.length - 1].range[1]);
}

// The seed is used to generate the name for an anonymous class,
// and this seed should be unique per browser's session.
// The value of the seed looks like this: 1229588505.2969012.
var classIDSeed = Date.now() % (60 * 60 * 1000) + Math.random();

/**
 * Generates a name for an anonymous class. The generated value looks like
 * this: "Classkc6pcn_mniza1yvi"
 * @param {String} scopeName
 * @return {string} the scope name for Anonymous Class
 */
function generateAnonymousClassName(scopeName) {
  classIDSeed++;
  return 'Class' +
    (classIDSeed).toString(36).replace('.', '_') +
    (scopeName || '');
}

function renderMethods(traverse, object, name, path, state) {
  var classElements = object.body && object.body.body || [];

  move(object.body.range[0] + 1, state);
  for (var i = 0; i < classElements.length; i++) {
    if (classElements[i].key.name !== 'constructor') {
      catchup(classElements[i].range[0], state);

      var memberName = classElements[i].key.name;
      if (shouldMungeName(state.scopeName, memberName, state)) {
        memberName = getMungedName(
          state.scopeName,
          memberName,
          state.g.opts.minify
        );
      }

      var prototypeOrStatic;
      if (classElements[i]['static']) {
        prototypeOrStatic = '';
      } else {
        prototypeOrStatic = 'prototype.';
      }

      append(name + '.' + prototypeOrStatic + memberName + ' = ', state);
      renderMethod(traverse, classElements[i], null, path, state);
      append(';', state);
    }
    move(classElements[i].range[1], state);
  }
  if (classElements.length) {
    append('\n', state);
  }
  move(object.range[1], state);
}

function renderMethod(traverse, method, name, path, state) {
  append(name ? 'function ' + name + '(' : 'function(', state);
  append(getCallParams(method, state) + ') {', state);
  move(method.value.body.range[0] + 1, state);
  traverse(method.value.body, path, state);
  catchup(method.value.body.range[1] - 1, state);
  append('}', state);
}

function renderSuperClass(traverse, superClass, path, state) {
  append('var ' + state.superVar + ' = ', state);
  move(superClass.range[0], state);
  traverse(superClass, path, state);
  catchup(superClass.range[1], state);
  append(';\n', state);
}

function renderConstructor(traverse, object, name, indent, path, state) {
  var classElements = object.body && object.body.body || [];
  var constructorIndex = findConstructorIndex(object);
  var constructor = constructorIndex === -1 ?
    null :
    classElements[constructorIndex];
  if (constructor) {
    move(constructorIndex === 0 ?
      object.body.range[0] + 1 :
      classElements[constructorIndex - 1].range[1], state);
    catchup(constructor.range[0], state);
    renderMethod(traverse, constructor, name, path, state);
    append('\n', state);
  } else {
    if (object.superClass) {
      append('\n' + indent, state);
    }
    append('function ', state);
    if (object.id) {
      move(object.id.range[0], state);
    }
    append(name, state);
    if (object.id) {
      move(object.id.range[1], state);
    }
    append('(){ ', state);
    if (object.body) {
      move(object.body.range[0], state);
    }
    append(getSuperConstructorSetup(
      object.superClass,
      indent,
      state.superVar), state);
    append('}\n', state);
  }
}

var superId = 0;
function renderClassBody(traverse, object, path, state) {
  var name = object.id ? object.id.name : 'constructor';
  var superClass = object.superClass;
  var indent = updateIndent(
    indentBefore(object.range[0], state) + '  ',
    state);

  state = updateState(
    state,
    {
      scopeName: object.id ? object.id.name :
        generateAnonymousClassName(state.scopeName),
      superVar: superClass ? '__super' + superId++ : ''
    });

  // super class
  if (superClass) {
    append(indent, state);
    renderSuperClass(traverse, superClass, path, state);
    append(getSuperProtoOfPrototypeVariable(state.superVar, indent), state);
  }

  renderConstructor(traverse, object, name, indent, path, state);
  append(getInheritanceSetup(superClass, name, indent, state.superVar), state);
  renderMethods(traverse, object, name, path, state);
}


/**
 * @public
 */
function visitClassExpression(traverse, object, path, state) {
  var indent = updateIndent(
    indentBefore(object.range[0], state) + '  ',
    state);
  var name = object.id ? object.id.name : 'constructor';

  append('(function() {\n', state);
  renderClassBody(traverse, object, path, state);
  append(indent + 'return ' + name + ';\n', state);
  append(indent.substring(0, indent.length - 2) + '})()', state);
  return false
}

visitClassExpression.test = function(object, path, state) {
  return object.type === Syntax.ClassExpression;
};

/**
 * @public
 */
function visitClassDeclaration(traverse, object, path, state) {
  state.g.indentBy--;
  renderClassBody(traverse, object, path, state);
  state.g.indentBy++;
  return false;
}

visitClassDeclaration.test = function(object, path, state) {
  return object.type === Syntax.ClassDeclaration;
};


/**
 * @public
 */
function visitSuperCall(traverse, object, path, state) {
  if (path[0].type === Syntax.CallExpression) {
    append(state.superVar +
      '.call(' + getSuperArguments(path[0], state) + ')', state);
    move(path[0].range[1], state);
  } else if (path[0].type === Syntax.MemberExpression) {
    append(getMemberFunctionCall(
      state.superVar,
      path[0].property.name,
      getSuperArguments(path[1], state)), state);
    move(path[1].range[1], state);
  }
  return false;
}

visitSuperCall.test = function(object, path, state) {
  return state.superVar && object.type === Syntax.Identifier &&
    object.name === 'super';
};

/**
 * @public
 */
function visitPrivateProperty(traverse, object, path, state) {
  var type = path[0] ? path[0].type : null;
  if (type !== Syntax.Property) {
    if (type === Syntax.MemberExpression) {
      type = path[0].object ? path[0].object.type : null;
      if (type === Syntax.Identifier &&
        path[0].object.range[0] === object.range[0]) {
        // Identifier is a variable that appears "private".
        return;
      }
    } else {
      // Other syntax that are neither Property nor MemberExpression.
      return;
    }
  }

  var oldName = object.name;
  var newName = getMungedName(
    state.scopeName,
    oldName,
    state.g.opts.minify
  );
  append(newName, state);
  move(object.range[1], state);
}

visitPrivateProperty.test = function(object, path, state) {
  return object.type === Syntax.Identifier &&
    shouldMungeName(state.scopeName, object.name, state);
};


exports.visitClassDeclaration = visitClassDeclaration;
exports.visitClassExpression = visitClassExpression;
exports.visitSuperCall = visitSuperCall;
exports.visitPrivateProperty = visitPrivateProperty;
