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
const { argv, stdin } = require('process');
const prettier = require('prettier');

const TAG_NAMES = new Set([
  'a','body','button','div','form','head','html','input','label','select','span','textarea',
  'value','checked','onClick','onSubmit','name'
]);

const BUILTIN_HOOKS = new Set([
  'useContext','useEffect','useInsertionEffect','useLayoutEffect','useReducer','useState'
]);

const GLOBALS = new Set([
  'String','Object','Function','Number','RegExp','Date','Error','TypeError','RangeError',
  'ReferenceError','SyntaxError','URIError','EvalError','Boolean','DataView','Float32Array',
  'Float64Array','Int8Array','Int16Array','Int32Array','Map','Set','WeakMap','Uint8Array',
  'Uint8ClampedArray','Uint16Array','Uint32Array','ArrayBuffer','JSON','parseFloat','parseInt',
  'console','isNaN','eval','isFinite','encodeURI','decodeURI','encodeURIComponent','decodeURIComponent',
  'map','push','at','filter','slice','splice','add','get','set','has','size','length','toString'
]);

// Helper to generate random string
function randomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return str;
}

// Helper to generate anonymized identifier
function getNextName(name, index) {
  const isCapitalized = /^[A-Z]/.test(name);
  const prefix = isCapitalized ? 'V' : 'v';
  let nextName = `${prefix}${index.toString(16)}`;
  if (name.startsWith('use')) {
    nextName = 'use' + nextName[0].toUpperCase() + nextName.slice(1);
  }
  return nextName;
}

function AnonymizePlugin(_babel) {
  let index = 0;
  const identifiers = new Map();
  const literals = new Map();

  return {
    name: 'anonymize',
    visitor: {
      JSXNamespacedName(path) {
        console.warn('Skipping JSXNamespacedName node.');
      },
      JSXIdentifier(path) {
        const name = path.node.name;
        if (TAG_NAMES.has(name)) return;

        if (!identifiers.has(name)) {
          const isCapitalized = /^[A-Z]/.test(name);
          const nextName = isCapitalized
            ? `Component${(index++).toString(16).toUpperCase()}`
            : `c${(index++).toString(16)}`;
          identifiers.set(name, nextName);
        }
        path.node.name = identifiers.get(name);
      },
      Identifier(path) {
        const name = path.node.name;
        if (BUILTIN_HOOKS.has(name) || GLOBALS.has(name)) return;

        if (!identifiers.has(name)) {
          identifiers.set(name, getNextName(name, index++));
        }
        path.node.name = identifiers.get(name);
      },
      JSXText(path) {
        const value = path.node.value;
        if (!literals.has(value)) {
          literals.set(value, randomString(value.length, 'abcdefghijklmnopqrstuvwxyz'));
        }
        path.node.value = literals.get(value);
      },
      StringLiteral(path) {
        const value = path.node.value;
        if (!literals.has(value)) {
          literals.set(value, randomString(value.length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
        }
        path.node.value = literals.get(value);
      },
      NumericLiteral(path) {
        const value = path.node.value;
        if (!literals.has(value)) {
          const nextValue = Number.isInteger(value)
            ? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
            : Math.random() * Number.MAX_VALUE;
          literals.set(value, nextValue);
        }
        path.node.value = literals.get(value);
      },
    },
  };
}

function runPlugin(text, file, language) {
  let ast;
  try {
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
  } catch (err) {
    console.error('Error parsing file:', err);
    process.exit(1);
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

  invariant(result?.code != null, `Expected BabelPluginReactForget to codegen successfully, got: ${result}`);
  return result.code;
}

async function formatCode(code, language) {
  return await prettier.format(code, {
    semi: true,
    parser: language === 'typescript' ? 'babel-ts' : 'flow',
  });
}

// Read file or stdin safely
let file = argv[2] || 'stdin.js';
let text;
try {
  text = argv[2] ? fs.readFileSync(file, 'utf8') : fs.readFileSync(stdin.fd, 'utf8');
} catch (err) {
  console.error(`Failed to read ${file}:`, err);
  process.exit(1);
}

const language = file.endsWith('.ts') || file.endsWith('.tsx') ? 'typescript' : 'flow';
const result = runPlugin(text, file, language);

formatCode(result, language)
  .then(console.log)
  .catch(err => {
    console.error('Error formatting code:', err);
    process.exit(1);
  });

