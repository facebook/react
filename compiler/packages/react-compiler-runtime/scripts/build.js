#!/usr/bin/env node

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const esbuild = require('esbuild');
const yargs = require('yargs');
const path = require('path');

const argv = yargs(process.argv.slice(2))
  .options('p', {
    alias: 'platform',
    default: 'browser',
    choices: ['browser', 'node'],
  })
  .options('w', {
    alias: 'watch',
    default: false,
    type: 'boolean',
  })
  .parse();

const config = {
  entryPoints: [path.join(__dirname, '../src/index.ts')],
  outfile: path.join(__dirname, '../dist/index.js'),
  bundle: true,
  external: ['react'],
  format: argv.p === 'browser' ? 'esm' : 'cjs',
  platform: argv.p,
  target: 'es6',
  banner: {
    js: `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @lightSyntaxTransform
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

"use no memo";`,
  },
};

async function main() {
  if (argv.w) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('watching for changes...');
  } else {
    await esbuild.build({
      sourcemap: true,
      minify: false,
      ...config,
    });
  }
}

main();
