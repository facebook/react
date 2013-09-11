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
'use strict';

var recast = require('recast');

exports.propagate = function(constants, source) {
  var ast = recast.parse(source);
  ast = new ConstantVisitor(constants).visit(ast);
  return recast.print(ast);
};

var ConstantVisitor = recast.Visitor.extend({
  init: function(constants) {
    this.constants = constants || {};
  },

  visitIdentifier: function(ident) {
    if (this.constants.hasOwnProperty(ident.name)) {
      return recast.builder.literal(this.constants[ident.name]);
    }
  },

  visitCallExpression: function(call) {
    if (!this.constants.__DEV__) {
      if (call.callee.type === 'Identifier' && call.callee.name === 'invariant') {
        call.arguments.length = 1;
      }
    }
    this.genericVisit(call);
  },

  visitIfStatement: function(stmt) {
    // Replaces all identifiers in this.constants with literal values.
    this.genericVisit(stmt);

    if (stmt.test.type === recast.Syntax.Literal) {
      if (stmt.test.value) {
        stmt.alternate = null;
      } else if (stmt.alternate) {
        return stmt.alternate;
      } else {
        // In case this if statement is an alternate clause for another
        // if-statement, replacing that alternate with null will have the
        // effect of pruning the unnecessary clause.  If this is just a
        // free-floating if statement, replacing it with null will have
        // the effect of removing it from the enclosing list of
        // statements.
        return null;
      }
    }
  }
});

if (!module.parent) {
  var constants = JSON.parse(process.argv[3]);
  recast.run(function(ast, callback) {
    callback(new ConstantVisitor(constants).visit(ast));
  });
}
