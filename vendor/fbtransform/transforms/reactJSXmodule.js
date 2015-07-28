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

/**
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

function visitReactJSXModuleDeclaration(traverse, node, path, state) {

  utils.append('"use strict";', state);
  traverse(node.imports, path, state);
  utils.move(node.range[1], state);

  return false;

}

/**
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
function visitReactJSXClassDeclaration(traverse, node, path, state) {

  state = utils.updateState(state, {
    className: node.className
  });

  utils.append('var ' + state.className.name+ ' = React.createClass({', state);

  utils.move(node.className.range[0], state);
  utils.append('\n  displayName: "'+state.className.name+'",', state);

  utils.append('\n  render: function() {\n    return ', state);

  utils.move(node.render.range[0], state);
  traverse(node.render, path, state);
  utils.move(node.render.range[1], state);
  utils.append(';\n  }', state);

  utils.move(node.range[1], state);
  utils.append('\n});', state);

  var error, export_class=true;
  node.attributes.forEach(function(attr) {
    switch (attr.name.name) {
    case 'export':
       switch (attr.value.value) {
       case 'false':
         export_class = false;
         break;
       case 'default':
         export_class = 'default';
         break;
       case 'true':
         break;
       default:
         error = 'Invalid value for export attribute';
         break;
       }
       break;
    default:
      error = 'Invalid attribute '+attr.name.name;
      break;
    }
  });

  if (error) {
    throw new Error(error +'. (line: ' +
      node.loc.start.line + ', col: ' + node.loc.start.column + ')'
    );
  }
  if (export_class === 'default') {
    utils.append('\nexport default '+state.className.name+';', state);
  }
  else if (export_class === true) {
    utils.append('\nexport '+state.className.name+';', state);
  }

  return false;

}

visitReactJSXModuleDeclaration.test = function(node, path, state) {
  return node.type === Syntax.JSXModuleDeclaration;
};

visitReactJSXClassDeclaration.test = function(node, path, state) {
  return node.type === Syntax.JSXClassDeclaration && node.superClass.name === 'ReactClass';
};

exports.visitorList = [
  visitReactJSXModuleDeclaration,
  visitReactJSXClassDeclaration
];
