/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-nocheck

// NOTE: this file is forked from ESLint's no-use-before-define rule:
// https://github.com/eslint/eslint/blob/15814057fd69319b3744bdea5db2455f85d2e74f/lib/rules/no-use-before-define.js
// The only change is to treat the {functions:false} option similarly to {variables:false},
// ie to disable validation for functions defined at module scope but still check for locally
// defined functions.

/**
 * @fileoverview Rule to flag use of variables before they are defined
 * @author Ilya Volodin
 */

("use strict");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const SENTINEL_TYPE =
  /^(?:(?:Function|Class)(?:Declaration|Expression)|ArrowFunctionExpression|CatchClause|ImportDeclaration|ExportNamedDeclaration)$/u;
const FOR_IN_OF_TYPE = /^For(?:In|Of)Statement$/u;

/**
 * Parses a given value as options.
 * @param {any} options A value to parse.
 * @returns {Object} The parsed options.
 */
function parseOptions(options) {
  let functions = true;
  let classes = true;
  let variables = true;
  let allowNamedExports = false;

  if (typeof options === "string") {
    functions = options !== "nofunc";
  } else if (typeof options === "object" && options !== null) {
    functions = options.functions !== false;
    classes = options.classes !== false;
    variables = options.variables !== false;
    allowNamedExports = !!options.allowNamedExports;
  }

  return { functions, classes, variables, allowNamedExports };
}

/**
 * Checks whether or not a given location is inside of the range of a given node.
 * @param {ASTNode} node An node to check.
 * @param {number} location A location to check.
 * @returns {boolean} `true` if the location is inside of the range of the node.
 */
function isInRange(node, location) {
  return node && node.range[0] <= location && location <= node.range[1];
}

/**
 * Checks whether or not a given location is inside of the range of a class static initializer.
 * Static initializers are static blocks and initializers of static fields.
 * @param {ASTNode} node `ClassBody` node to check static initializers.
 * @param {number} location A location to check.
 * @returns {boolean} `true` if the location is inside of a class static initializer.
 */
function isInClassStaticInitializerRange(node, location) {
  return node.body.some(
    (classMember) =>
      (classMember.type === "StaticBlock" &&
        isInRange(classMember, location)) ||
      (classMember.type === "PropertyDefinition" &&
        classMember.static &&
        classMember.value &&
        isInRange(classMember.value, location))
  );
}

/**
 * Checks whether a given scope is the scope of a class static initializer.
 * Static initializers are static blocks and initializers of static fields.
 * @param {eslint-scope.Scope} scope A scope to check.
 * @returns {boolean} `true` if the scope is a class static initializer scope.
 */
function isClassStaticInitializerScope(scope) {
  if (scope.type === "class-static-block") {
    return true;
  }

  if (scope.type === "class-field-initializer") {
    // `scope.block` is PropertyDefinition#value node
    const propertyDefinition = scope.block.parent;

    return propertyDefinition.static;
  }

  return false;
}

/**
 * Checks whether a given reference is evaluated in an execution context
 * that isn't the one where the variable it refers to is defined.
 * Execution contexts are:
 * - top-level
 * - functions
 * - class field initializers (implicit functions)
 * - class static blocks (implicit functions)
 * Static class field initializers and class static blocks are automatically run during the class definition evaluation,
 * and therefore we'll consider them as a part of the parent execution context.
 * Example:
 *
 *   const x = 1;
 *
 *   x; // returns `false`
 *   () => x; // returns `true`
 *
 *   class C {
 *       field = x; // returns `true`
 *       static field = x; // returns `false`
 *
 *       method() {
 *           x; // returns `true`
 *       }
 *
 *       static method() {
 *           x; // returns `true`
 *       }
 *
 *       static {
 *           x; // returns `false`
 *       }
 *   }
 * @param {eslint-scope.Reference} reference A reference to check.
 * @returns {boolean} `true` if the reference is from a separate execution context.
 */
function isFromSeparateExecutionContext(reference) {
  const variable = reference.resolved;
  let scope = reference.from;

  // Scope#variableScope represents execution context
  while (variable.scope.variableScope !== scope.variableScope) {
    if (isClassStaticInitializerScope(scope.variableScope)) {
      scope = scope.variableScope.upper;
    } else {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether or not a given reference is evaluated during the initialization of its variable.
 *
 * This returns `true` in the following cases:
 *
 *     var a = a
 *     var [a = a] = list
 *     var {a = a} = obj
 *     for (var a in a) {}
 *     for (var a of a) {}
 *     var C = class { [C]; };
 *     var C = class { static foo = C; };
 *     var C = class { static { foo = C; } };
 *     class C extends C {}
 *     class C extends (class { static foo = C; }) {}
 *     class C { [C]; }
 * @param {Reference} reference A reference to check.
 * @returns {boolean} `true` if the reference is evaluated during the initialization.
 */
function isEvaluatedDuringInitialization(reference) {
  if (isFromSeparateExecutionContext(reference)) {
    /*
     * Even if the reference appears in the initializer, it isn't evaluated during the initialization.
     * For example, `const x = () => x;` is valid.
     */
    return false;
  }

  const location = reference.identifier.range[1];
  const definition = reference.resolved.defs[0];

  if (definition.type === "ClassName") {
    // `ClassDeclaration` or `ClassExpression`
    const classDefinition = definition.node;

    return (
      isInRange(classDefinition, location) &&
      /*
       * Class binding is initialized before running static initializers.
       * For example, `class C { static foo = C; static { bar = C; } }` is valid.
       */
      !isInClassStaticInitializerRange(classDefinition.body, location)
    );
  }

  let node = definition.name.parent;

  while (node) {
    if (node.type === "VariableDeclarator") {
      if (isInRange(node.init, location)) {
        return true;
      }
      if (
        FOR_IN_OF_TYPE.test(node.parent.parent.type) &&
        isInRange(node.parent.parent.right, location)
      ) {
        return true;
      }
      break;
    } else if (node.type === "AssignmentPattern") {
      if (isInRange(node.right, location)) {
        return true;
      }
    } else if (SENTINEL_TYPE.test(node.type)) {
      break;
    }

    node = node.parent;
  }

  return false;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('../shared/types').Rule} */
const NoUseBeforeDefineRule = {
  meta: {
    type: "problem",

    docs: {
      description: "Disallow the use of variables before they are defined",
      recommended: false,
      url: "https://eslint.org/docs/rules/no-use-before-define",
    },

    schema: [
      {
        oneOf: [
          {
            enum: ["nofunc"],
          },
          {
            type: "object",
            properties: {
              functions: { type: "boolean" },
              classes: { type: "boolean" },
              variables: { type: "boolean" },
              allowNamedExports: { type: "boolean" },
            },
            additionalProperties: false,
          },
        ],
      },
    ],

    messages: {
      usedBeforeDefined: "'{{name}}' was used before it was defined.",
    },
  },

  create(context) {
    const options = parseOptions(context.options[0]);

    /**
     * Determines whether a given reference should be checked.
     *
     * Returns `false` if the reference is:
     * - initialization's (e.g., `let a = 1`).
     * - referring to an undefined variable (i.e., if it's an unresolved reference).
     * - referring to a variable that is defined, but not in the given source code
     *   (e.g., global environment variable or `arguments` in functions).
     * - allowed by options.
     * @param {eslint-scope.Reference} reference The reference
     * @returns {boolean} `true` if the reference should be checked
     */
    function shouldCheck(reference) {
      if (reference.init) {
        return false;
      }

      const { identifier } = reference;

      if (
        options.allowNamedExports &&
        identifier.parent.type === "ExportSpecifier" &&
        identifier.parent.local === identifier
      ) {
        return false;
      }

      const variable = reference.resolved;

      if (!variable || variable.defs.length === 0) {
        return false;
      }

      const definitionType = variable.defs[0].type;

      if (
        ((!options.variables && definitionType === "Variable") ||
          (!options.classes && definitionType === "ClassName") ||
          (!options.functions && definitionType === "FunctionName")) &&
        // don't skip checking the reference if it's in the same execution context, because of TDZ
        isFromSeparateExecutionContext(reference)
      ) {
        return false;
      }

      return true;
    }

    /**
     * Finds and validates all references in a given scope and its child scopes.
     * @param {eslint-scope.Scope} scope The scope object.
     * @returns {void}
     */
    function checkReferencesInScope(scope) {
      scope.references.filter(shouldCheck).forEach((reference) => {
        const variable = reference.resolved;
        const definitionIdentifier = variable.defs[0].name;

        if (
          reference.identifier.range[1] < definitionIdentifier.range[1] ||
          isEvaluatedDuringInitialization(reference)
        ) {
          context.report({
            node: reference.identifier,
            messageId: "usedBeforeDefined",
            data: reference.identifier,
          });
        }
      });

      scope.childScopes.forEach(checkReferencesInScope);
    }

    function isReactFunction(node) {
      return (
        node.body.type === "BlockStatement" &&
        node.body.body.some(
          (stmt) =>
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "Literal" &&
            stmt.expression.value === "use forget"
        )
      );
    }

    return {
      FunctionExpression(node) {
        if (isReactFunction(node)) {
          checkReferencesInScope(context.getScope());
        }
      },
      FunctionDeclaration(node) {
        if (isReactFunction(node)) {
          checkReferencesInScope(context.getScope());
        }
      },
    };
  },
};

export default NoUseBeforeDefineRule;
