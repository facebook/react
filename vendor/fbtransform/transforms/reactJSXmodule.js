/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
'use strict';

var Syntax = require('jstransform').Syntax;
var utils = require('jstransform/src/utils');

/*
 * Transforms the following:
 *
 * <!doctype jsx>
 * <ReactClass MyComponent>'
 *   <ELEMENTS...>
 *   <SCRIPTS...>
 * </ReactClass MyComponent>
 *
 * into:
 *
 * var MyComponent = React.createClass({
 *    displayName: 'MyComponent',
 *    render: ()=>ELEMENTS,
 *    TRANSPILED SCRIPTS
 * });
 * export MyComponent;
 *
 */


/**
 * Transforms imports:
 */

function visitReactJSXModuleDeclaration(traverse, node, path, state) {

  utils.append('"use strict";', state);
  traverse(node.imports, path, state);
  utils.move(node.range[1], state);

  return false;

}

/*** throws error with node.loc */

function throwError(node, error) {
  throw new Error(error + '. (line: ' +
    node.loc.start.line + ', col: ' + node.loc.start.column + ')'
  );
}


function checkReactMethod(stmt) {
  if (stmt.type === Syntax.FunctionDeclaration) {
    switch (stmt.id.name) {
    case 'getInitialState':
    case 'getDefaultProps':
    case 'propTypes':
    case 'componentWillMount':
    case 'componentDidMount':
    case 'componentWillUnmount':
      if (stmt.params.length !== 0) {
        throwError(stmt, 'Unexpected argument');
      }
      break;
    case 'shouldComponentUpdate':
    case 'componentWillUpdate':
      if (stmt.params.length !== 2 ||
        stmt.params[0].name !== 'nextProps' ||
        stmt.params[1].name !== 'nextState') {
        throwError(stmt, 'Expected ' + stmt.id.name + '(nextProps, nextState)');
      }
      break;
    case 'componentDidUpdate':
      if (stmt.params.length !== 2 ||
        stmt.params[0].name !== 'prevProps' ||
        stmt.params[1].name !== 'prevState') {
        throwError(stmt, 'Expected componentDidUpdate(prevProps, prevState)');
      }
      break;
    case 'componentWillReceiveProps':
      if (stmt.params.length !== 1 || stmt.params[0].name !== 'nextProps') {
        throwError(stmt, 'Expected componentWillReceiveProps(nextProps)');
      }
      break;
    }
  }
}

/**
 * Transforms the following:
 *
 * <ReactClass MyComponent>'
 *   <ELEMENTS...>
 *   <SCRIPTS...>
 * </ReactClass MyComponent>
 *
 * into:
 *
 * var MyComponent = React.createClass({
 *    displayName: 'MyComponent',
 *    render: ()=>ELEMENTS,
 *    TRANSPILED SCRIPTS
 * });
 * export MyComponent;
 *
 */
function visitReactJSXClassDeclaration(traverse, node, path, state) {

  state = utils.updateState(state, {
    className: node.className
  });

  utils.append('var ' + state.className.name + ' = React.createClass({', state);

  utils.move(node.className.range[0], state);
  utils.append('\n  displayName: "' + state.className.name + '",', state);

  node.body.forEach(function(stmt) {
    if (stmt.type === 'FunctionDeclaration') {
      checkReactMethod(stmt);
      utils.move(stmt.range[0], state);
      utils.append('\n  ' + stmt.id.name + ': ', state);
    }
    traverse(stmt, path, state);
  });

  utils.append('\n  render: function render() {\n    return ', state);

  utils.move(node.render.range[0], state);
  traverse(node.render, path, state);
  utils.move(node.render.range[1], state);
  utils.append(';\n  }', state);

  utils.move(node.range[1], state);
  utils.append('\n});', state);

  var exportClass = true;
  node.attributes.forEach(function(attr) {
    switch (attr.name.name) {
    case 'export':
      switch (attr.value.value) {
      case 'false':
        exportClass = false;
        break;
      case 'default':
        exportClass = 'default';
        break;
      case 'true':
        break;
      default:
        throwError(node, 'Invalid value for export attribute');
        break;
      }
      break;
    default:
      throwError(node, 'Invalid attribute ' + attr.name.name);
      break;
    }
  });

  if (exportClass === 'default') {
    utils.append('\nexport default ' + state.className.name + ';', state);
  } else if (exportClass === true) {
    utils.append('\nexport ' + state.className.name + ';', state);
  }

  return false;

}

visitReactJSXModuleDeclaration.test = function(node, path, state) {
  return node.type === Syntax.JSXModuleDeclaration;
};

visitReactJSXClassDeclaration.test = function(node, path, state) {
  return (
    node.type === Syntax.JSXClassDeclaration &&
    node.superClass.name === 'ReactClass'
  );
};

exports.visitorList = [
  visitReactJSXModuleDeclaration,
  visitReactJSXClassDeclaration
  // TODO  visitReactJSXScriptContainer - non-javascripts (like css/less)
];
