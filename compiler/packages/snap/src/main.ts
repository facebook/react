/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fork } from 'child_process';
import invariant from 'invariant';
import process from 'process';
import * as readline from 'readline';
import { hideBin } from 'yargs/helpers';

// Setup keypress event listeners
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

let childProc; // Declare variable to hold the child process

/**
 * Handles 'keypress' events, specifically CTRL + C
 * for killing the child process gracefully.
 */
process.stdin.on('keypress', (_, key) => {
  if (key && key.name === 'c' && key.ctrl) {
    if (childProc) {
      console.log('Interrupted! Killing child process...');
      childProc.kill('SIGINT');
      childProc.unref();
      process.exit(-1); // Exit with error code
    }
  }
});

try {
  // Fork the child process
  childProc = fork(require.resolve('./runner.js'), hideBin(process.argv), {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'], // Use pipes for stdio
    env: { ...process.env, FORCE_COLOR: 'true' }, // Forward environment variables
  });

  invariant(
    childProc.stdin && childProc.stdout && childProc.stderr,
    'Expected forked process to have piped stdio',
  );

  // Pipe parent stdin to child stdin, and child's output to parent's output
  process.stdin.pipe(childProc.stdin);
  childProc.stdout.pipe(process.stdout);
  childProc.stderr.pipe(process.stderr);

  // Handle child process exit event
  childProc.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code ?? -1);
  });
  
} catch (error) {
  console.error('Failed to start the child process:', error);
  process.exit(1); // Exit with failure
}
