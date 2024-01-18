/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ESNode, CallExpression} from 'hermes-estree';
import type {TransformContext} from 'hermes-transform';

const {transform, t} = require('hermes-transform');
const {SimpleTraverser} = require('hermes-parser');
const Glob = require('glob');
const {readFileSync, writeFileSync} = require('fs');
const Prettier = require('prettier');

/* eslint-disable no-for-of-loops/no-for-of-loops */

function containsReactDOMRenderCall(func: ESNode): boolean {
  if (
    func.type !== 'ArrowFunctionExpression' &&
    func.type !== 'FunctionExpression'
  ) {
    throw new Error('expected a function');
  }
  let result = false;
  SimpleTraverser.traverse(func.body, {
    enter(node: ESNode) {
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'ReactDOM' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'render'
      ) {
        result = true;
        throw SimpleTraverser.Break;
      }
    },
    leave() {},
  });
  return result;
}

function updateItToAsync(context: TransformContext) {
  return {
    CallExpression(node: CallExpression) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'it' &&
        node.arguments.length === 2
      ) {
        const fn = node.arguments[1];
        if (
          fn.type !== 'ArrowFunctionExpression' &&
          fn.type !== 'FunctionExpression'
        ) {
          throw new Error('expected a function as argument to it()');
        }
        if (containsReactDOMRenderCall(fn)) {
          context.replaceNode(
            fn,
            t.ArrowFunctionExpression({
              params: [],
              body: fn.body,
              async: true,
            }),
          );
        }
      }
    },
  };
}

// function updateExpectToAsync(context: TransformContext) {
//   return {
//     CallExpression(node: CallExpression) {
//       if (
//         node.callee.type === 'MemberExpression' &&
//         node.callee.object.type === 'CallExpression' &&
//         node.callee.object.callee.type === 'Identifier' &&
//         node.callee.object.callee.name === 'expect' &&
//         node.callee.object.arguments.length === 1 &&
//         (node.callee.object.arguments[0].type === 'ArrowFunctionExpression' ||
//           node.callee.object.arguments[0].type === 'FunctionExpression') &&
//         containsReactDOMRenderCall(node.callee.object.arguments[0])
//       ) {
//         const cloned = context.deepCloneNode(node);
//         // $FlowFixMe
//         cloned.callee.object.arguments[0] = t.ArrowFunctionExpression({
//           params: [],
//           body: t.BlockStatement({
//             // $FlowFixMe
//             body: [cloned.callee.object.arguments[0].body],
//           }),
//           async: true,
//         });
//         context.replaceNode(
//           node,
//           t.AwaitExpression({
//             argument: cloned,
//           })
//         );
//       }
//     },
//   };
// }

// function replaceReactDOMRender(context: TransformContext) {
//   return {
//     CallExpression(node: CallExpression) {
//       if (
//         node.callee.type === 'MemberExpression' &&
//         node.callee.object.type === 'Identifier' &&
//         node.callee.object.name === 'ReactDOM' &&
//         node.callee.property.type === 'Identifier' &&
//         node.callee.property.name === 'render'
//       ) {
//         const renderRoot = t.CallExpression({
//           callee: t.MemberExpression({
//             object: t.Identifier({name: 'root'}),
//             property: t.Identifier({name: 'render'}),
//             computed: false,
//           }),
//           arguments: [node.arguments[0]],
//         });
//         context.replaceNode(
//           node,
//           t.AwaitExpression({
//             argument: t.CallExpression({
//               callee: t.Identifier({name: 'act'}),
//               arguments: [
//                 t.ArrowFunctionExpression({
//                   async: false,
//                   params: [],
//                   body: t.BlockStatement({
//                     body: [
//                       t.ExpressionStatement({
//                         expression: renderRoot,
//                       }),
//                     ],
//                   }),
//                 }),
//               ],
//             }),
//           })
//         );
//       }
//     },
//   };
// }

const visitors = [
  updateItToAsync,
  // updateExpectToAsync,
  // replaceReactDOMRender,
];

async function transformFile(filename: string) {
  const originalCode = readFileSync(filename, 'utf8');
  const prettierConfig = await Prettier.resolveConfig(filename);
  let transformedCode = originalCode;
  for (const createVisitors of visitors) {
    transformedCode = await transform(
      transformedCode,
      createVisitors,
      prettierConfig,
    );
  }
  if (originalCode !== transformedCode) {
    writeFileSync(filename, transformedCode, 'utf8');
    return true;
  }
  return false;
}

async function main(args: $ReadOnlyArray<string>) {
  if (args.length !== 1) {
    console.error('Usage: yarn codemod <PATTERN>');
    process.exit(1);
  }
  const files = Glob.sync(args[0]);
  let updatedCount = 0;
  for (const file of files) {
    const updated = await transformFile(file);
    if (updated) {
      updatedCount++;
      console.log(`updated ${file}`);
    }
  }
  console.log(`${files.length} processed, ${updatedCount} updated`);
}

main(process.argv.slice(2)).catch(err => {
  console.error('Error while transforming:', err);
});
