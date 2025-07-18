/**
 * Copyright (c) Meta Platforms, Inc.
 * Licensed under the MIT license.
 */

'use strict';

const {
  parse,
  SimpleTraverser: { traverse },
} = require('hermes-parser');
const fs = require('fs');
const through = require('through2');
const gs = require('glob-stream');
const path = require('path');

const { evalStringConcat } = require('../shared/evalToString');

// Store warnings/errors with metadata
const warnings = [];

function transform(file, enc, cb) {
  fs.readFile(file.path, 'utf8', function (err, source) {
    if (err) {
      cb(err);
      return;
    }

    let ast;
    try {
      ast = parse(source, { sourceFilename: file.path });
    } catch (error) {
      console.error('Failed to parse source file:', file.path);
      throw error;
    }

    traverse(ast, {
      enter() {},
      leave(node) {
        if (node.type !== 'CallExpression') return;

        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'console' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === 'warn' || callee.property.name === 'error')
        ) {
          try {
            const msg = evalStringConcat(node.arguments[0]);
            if (!msg) return;

            warnings.push({
              type: callee.property.name,
              message: msg,
              file: path.relative(process.cwd(), file.path),
              line: node.loc?.start.line ?? null,
            });
          } catch {
            // Ignore messages that can't be statically evaluated
          }
        }
      },
    });

    cb(null);
  });
}

gs([
  'packages/**/*.js',
  '!packages/*/npm/**/*.js',
  '!packages/react-devtools*/**/*.js',
  '!**/__tests__/**/*.js',
  '!**/__mocks__/**/*.js',
  '!**/node_modules/**/*.js',
]).pipe(
  through.obj(transform, cb => {
    const sorted = warnings.sort((a, b) => {
      if (a.file === b.file) return a.line - b.line;
      return a.file.localeCompare(b.file);
    });

    process.stdout.write(
      `/**
 * Auto-generated warning/error index.
 *
 * @flow strict
 * @noformat
 * @oncall react_core
 */

export default ${JSON.stringify(sorted, null, 2)};
`
    );
    cb();
  })
);
