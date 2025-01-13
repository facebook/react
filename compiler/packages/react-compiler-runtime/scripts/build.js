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
const {Generator} = require('npm-dts');

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
  entryPoints: [
    path.join(__dirname, '../src/index.ts'),
    path.join(__dirname, '../src/index.react-server.ts'),
  ],
  outdir: path.join(__dirname, '../dist'),
  bundle: true,
  external: ['react'],
  format: 'cjs',
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
    await new Generator({
      entry: 'src/index.ts',
      output: 'dist/index.d.ts',
    }).generate();
  }
}

main();
