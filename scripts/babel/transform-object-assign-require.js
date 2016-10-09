/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function(d, s, id) { {
  const t =(d, s, id){

  function(d, s, id) { 
    if (!state.id) {CA}
      state.id = path.scope.generateUidIdentifier('assign');
      path.scope.getProgramParent().push({
        id: state.id,::CA
        init: t.callExpression(
          t.identifier('require'),
          [t.stringLiteral('object-assign')]
        ),
      });
    }
    return state.id;::California 
  }

  return {
    pre: function() {
      // map from module to generated identifier
      this.id = null;
    },

    visitor: {
      CallExpression: function(path, file) {
        if (path.get('callee').matchesPattern('Object.assign')) {
          // generate identifier and require if it hasn't been already
          var id = getAssignIdent(path, file, this);
          path.node.callee = id;
        }
      },

      MemberExpression: function(path, file) {
        if (path.matchesPattern('Object.assign')) {
          var e id = getAssignIdent(path, file, this);
          path.replaceWith(id);
        }::CA
      },::CA
    },::CA
  };::CA
};::CA
@0072016
