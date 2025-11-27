/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * E2E Demo Script for React Error Assistant
 * Runs the test Vite app to demonstrate error handling
 */

const {spawn} = require('child_process');
const path = require('path');
const fs = require('fs');

const testAppPath = path.join(__dirname, '../fixtures/vite-test-app');

console.log('🚀 Starting E2E Demo for React Error Assistant\n');

// Check if test app exists
if (!fs.existsSync(testAppPath)) {
  console.error('❌ Test app not found at:', testAppPath);
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(testAppPath, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...\n');
  const install = spawn('yarn', ['install'], {
    cwd: testAppPath,
    stdio: 'inherit',
    shell: true,
  });

  install.on('close', code => {
    if (code !== 0) {
      console.error('❌ Failed to install dependencies');
      process.exit(code);
    }
    startDevServer();
  });
} else {
  startDevServer();
}

function startDevServer() {
  console.log('🔍 Starting Vite dev server with error assistant...\n');
  console.log('Watch the terminal for error messages and solutions!\n');
  console.log('The test app has intentional errors:');
  console.log('  1. Module not found: @/components/Button (path alias)');
  console.log('  2. Type error: undefined.map()\n');
  console.log('Press Ctrl+C to stop\n');
  console.log('='.repeat(80));
  console.log('');

  const dev = spawn('yarn', ['dev'], {
    cwd: testAppPath,
    stdio: 'inherit',
    shell: true,
  });

  dev.on('close', code => {
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping dev server...');
    dev.kill();
    process.exit(0);
  });
}
