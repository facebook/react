/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const HermesParser = require('hermes-parser');
const BabelParser = require('@babel/parser');
const BabelCore = require('@babel/core');
const invariant = require('invariant');
const {argv, stdin} = require('process');
const prettier = require('prettier');

function runPlugin(text, file, language) {
  let ast;
  if (language === 'flow') {
    ast = HermesParser.parse(text, {
      babel: true,
      flow: 'all',
      sourceFilename: file,
      sourceType: 'module',
      enableExperimentalComponentSyntax: true,
    });
  } else {
    ast = BabelParser.parse(text, {
      sourceFilename: file,
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    });
  }
  const result = BabelCore.transformFromAstSync(ast, text, {
    ast: false,
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [[AnonymizePlugin]],
    sourceType: 'module',
    configFile: false,
    babelrc: false,
  });
  invariant(
    result?.code != null,
    `Expected BabelPluginReactForget to codegen successfully, got: ${result}`
  );
  return result.code;
}

async function format(code, language) {
  return await prettier.format(code, {
    semi: true,
    parser: language === 'typescript' ? 'babel-ts' : 'flow',
  });
}

const TAG_NAMES = new Set([
  'div',
  'span',
  'input',
  'button',
  'a',
  'form',
  'select',
  'textarea',
  'body',
  'head',
  'html',
]);

function AnonymizePlugin(_babel) {
  let index = 0;
  const identifiers = new Map();
  const literals = new Map();
  return {
    name: 'anonymize',
    visitor: {
      JSXNamespacedName(path) {
        throw error('TODO: handle JSXNamedspacedName');
      },
      JSXIdentifier(path) {
        const name = path.node.name;
        let nextName = identifiers.get(name);
        if (nextName == null) {
          const isCapitalized =
            name.slice(0, 1).toUpperCase() === name.slice(0, 1);
          nextName = isCapitalized
            ? `Component${(index++).toString(16).toUpperCase()}`
            : TAG_NAMES.has(name)
              ? name
              : `c${(index++).toString(16)}`;
          identifiers.set(name, nextName);
        }
        path.node.name = nextName;
      },
      Identifier(path) {
        const name = path.node.name;
        let nextName = identifiers.get(name);
        if (nextName == null) {
          const isCapitalized =
            name.slice(0, 1).toUpperCase() === name.slice(0, 1);
          const prefix = isCapitalized ? 'V' : 'v';
          nextName = `${prefix}${(index++).toString(16)}`;
          identifiers.set(name, nextName);
        }
        path.node.name = nextName;
      },
      StringLiteral(path) {
        const value = path.node.value;
        let nextValue = literals.get(value);
        if (nextValue == null) {
          let string = '';
          while (string.length < value.length) {
            string += String.fromCharCode(Math.round(Math.random() * 58) + 65);
          }
          nextValue = string;
          literals.set(value, nextValue);
        }
        path.node.value = nextValue;
      },
      NumericLiteral(path) {
        const value = path.node.value;
        let nextValue = literals.get(value);
        if (nextValue == null) {
          nextValue = Number.isInteger(value)
            ? Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
            : Math.random() * Number.MAX_VALUE;
          literals.set(value, nextValue);
        }
        path.node.value = nextValue;
      },
    },
  };
}

let file;
let text;
if (argv.length >= 3) {
  file = argv[2];
  text = fs.readFileSync(file, 'utf8');
} else {
  // read from stdin
  file = 'stdin.js';
  text = fs.readFileSync(stdin.fd, 'utf8');
}
const language =
  file.endsWith('.ts') || file.endsWith('.tsx') ? 'typescript' : 'flow';
const result = runPlugin(text, file, language);
format(result, language).then(formatted => {
  console.log(formatted);
});
