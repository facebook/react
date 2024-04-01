/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ESNode,
  IfStatement,
  Statement,
  ImportDeclaration,
  LogicalExpression,
  CallExpression,
  ConditionalExpression,
  UnaryExpression,
  Identifier,
  MemberExpression,
} from 'hermes-estree';
import type {TransformContext} from 'hermes-transform';

const {transform, t} = require('hermes-transform');
const {SimpleTraverser} = require('hermes-parser');
const Glob = require('glob');
const {readFileSync, writeFileSync} = require('fs');
const Prettier = require('prettier');

/* eslint-disable no-for-of-loops/no-for-of-loops */

function createReplaceFlagWithValue(flagName: string, flagValue: boolean) {
  return function replaceFlagWithValue(context: TransformContext) {
    return {
      ImportDeclaration(node: ImportDeclaration) {
        context.skipTraversal();
      },
      Identifier(node: Identifier) {
        if (node.parent.type === 'VariableDeclarator') {
          return;
        }
        if (node.type === 'Identifier' && node.name === flagName) {
          context.replaceNode(node, t.BooleanLiteral({value: flagValue}));
        }
      },
      MemberExpression(node: MemberExpression) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'flags' &&
          node.property.type === 'Identifier' &&
          node.property.name === flagName
        ) {
          context.replaceNode(node, t.BooleanLiteral({value: flagValue}));
          context.skipTraversal();
        }
      },
    };
  };
}

function simplifyNotBoolean(context: TransformContext) {
  return {
    UnaryExpression(node: UnaryExpression) {
      if (node.operator === '!' && node.argument.type === 'Literal') {
        context.replaceNode(
          node,
          t.BooleanLiteral({value: !node.argument.value})
        );
      }
    },
  };
}

function simplifyGate(context: TransformContext) {
  return {
    CallExpression(node: CallExpression) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'gate' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'ArrowFunctionExpression' &&
        node.arguments[0].body.type === 'Literal'
      ) {
        context.replaceNode(node, node.arguments[0].body);
      }
    },
  };
}

function simplifyLogicalExpression(context: TransformContext) {
  return {
    LogicalExpression(node: LogicalExpression) {
      if (
        node.operator === '&&' &&
        node.left.type === 'Literal' &&
        node.left.value === true
      ) {
        context.replaceNode(node, node.right);
      }
      if (
        node.operator === '&&' &&
        node.left.type === 'Literal' &&
        node.left.value === false
      ) {
        context.replaceNode(node, node.left);
      }
      if (
        node.operator === '&&' &&
        node.right.type === 'Literal' &&
        node.right.value === true
      ) {
        context.replaceNode(node, node.left);
      }
      if (
        node.operator === '||' &&
        node.left.type === 'Literal' &&
        node.left.value === false
      ) {
        context.replaceNode(node, node.right);
      }
      if (
        node.operator === '||' &&
        node.right.type === 'Literal' &&
        node.right.value === false
      ) {
        context.replaceNode(node, node.left);
      }
    },
  };
}

function simplifyTernary(context: TransformContext) {
  return {
    ConditionalExpression(node: ConditionalExpression) {
      if (node.test.type === 'Literal' && node.test.value === true) {
        context.replaceNode(node, node.consequent);
      }
      if (node.test.type === 'Literal' && node.test.value === false) {
        context.replaceNode(node, node.alternate);
      }
    },
  };
}

function simplifyCondition(context: TransformContext) {
  let lastParent: ?ESNode = null;
  return {
    IfStatement(node: IfStatement) {
      if (node.parent === lastParent) {
        // a bug in hermes-transform prevents multiple replaceStatementWithMany
        // with the same parent
        return;
      }
      if (node.test.type === 'Literal' && node.test.value === true) {
        lastParent = node.parent;
        context.replaceStatementWithMany(
          node,
          unwrapBlockStatment(node.consequent)
        );
      }
      if (node.test.type === 'Literal' && node.test.value === false) {
        lastParent = node.parent;
        if (node.alternate == null) {
          context.removeStatement(node);
        } else {
          context.replaceStatementWithMany(
            node,
            unwrapBlockStatment(node.alternate)
          );
        }
      }
    },
  };
}

function unwrapBlockStatment(statement: Statement): $ReadOnlyArray<Statement> {
  return statement.type === 'BlockStatement' ? statement.body : [statement];
}

async function transformFile(
  filename: string,
  flagName: string,
  flagValue: boolean
) {
  const originalCode = readFileSync(filename, 'utf8');
  if (!originalCode.includes(flagName)) {
    return false;
  }
  const prettierConfig = await Prettier.resolveConfig(filename);
  let transformedCode = originalCode;
  transformedCode = transformedCode.replaceAll(`// @gate ${flagName}\n`, '');
  transformedCode = transformedCode.replaceAll(
    `// @gate ${flagName} && `,
    '// @gate '
  );
  transformedCode = transformedCode.replaceAll(
    `// @gate ${flagName} || `,
    '// XXX REMOVE XXX'
  );
  for (const createVisitors of [
    createReplaceFlagWithValue(flagName, flagValue),
    simplifyNotBoolean,
    simplifyGate,
    simplifyLogicalExpression,
    simplifyLogicalExpression,
    simplifyTernary,
    simplifyCondition,
    simplifyCondition,
    simplifyCondition,
  ]) {
    transformedCode = await transform(
      transformedCode,
      createVisitors,
      prettierConfig
    );
  }
  if (originalCode !== transformedCode) {
    writeFileSync(filename, transformedCode, 'utf8');
    return true;
  }
  return false;
}

async function main(args: $ReadOnlyArray<string>) {
  if (args.length < 1) {
    console.error('Usage: yarn codemod <PATTERNS>');
    process.exit(1);
  }
  const {FLAG_NAME: flagName, FLAG_VALUE: flagValue} = process.env;

  if (flagName == null || flagValue == null) {
    console.error('Please set FLAG_NAME and FLAG_VALUE environment variables');
    process.exit(1);
    return;
  }

  let flagValueBoolean = flagValue !== 'false';

  const files = new Set<string>();
  for (const arg of args) {
    for (const file of Glob.sync(arg)) {
      files.add(file);
    }
  }
  let updatedCount = 0;
  for (const file of files) {
    try {
      const updated = await transformFile(file, flagName, flagValueBoolean);
      if (updated) {
        updatedCount++;
        console.log(`updated ${file}`);
      }
    } catch (err) {
      console.log(`Error transforming ${file}`, err);
    }
  }
  console.log(`${files.size} processed, ${updatedCount} updated`);
}

main(process.argv.slice(2)).catch(err => {
  console.error('Error while transforming:', err);
});
