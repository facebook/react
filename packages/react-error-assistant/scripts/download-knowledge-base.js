/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Script to download and build knowledge base for React Error Assistant.
 */

const {spawn} = require('child_process');
const path = require('path');
const fs = require('fs');

const KNOWLEDGE_BASE_SCRIPT = path.join(
  __dirname,
  '../python/scripts/build-knowledge-base.py'
);

async function downloadKnowledgeBase() {
  console.log('📚 Downloading and building knowledge base...');
  console.log('This may take several minutes...\n');

  // Check if Python is available
  const pythonAvailable = await checkPython();
  if (!pythonAvailable) {
    console.error('❌ Python 3.9+ is required but not found.');
    console.error('Please install Python and try again.');
    process.exit(1);
  }

  // Check if script exists
  if (!fs.existsSync(KNOWLEDGE_BASE_SCRIPT)) {
    console.error(
      `❌ Knowledge base build script not found at ${KNOWLEDGE_BASE_SCRIPT}`
    );
    process.exit(1);
  }

  // Run Python script
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const process_ = spawn(python, [KNOWLEDGE_BASE_SCRIPT], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  process_.on('close', code => {
    if (code === 0) {
      console.log('\n✅ Knowledge base downloaded and built successfully!');
    } else {
      console.error(`\n❌ Knowledge base build failed with code ${code}`);
      process.exit(code);
    }
  });

  process_.on('error', error => {
    console.error('❌ Failed to start Python process:', error.message);
    process.exit(1);
  });
}

async function checkPython() {
  return new Promise(resolve => {
    const python = process.platform === 'win32' ? 'python' : 'python3';
    const process_ = spawn(python, ['--version']);

    process_.on('error', () => resolve(false));
    process_.on('close', code => resolve(code === 0));
  });
}

if (require.main === module) {
  downloadKnowledgeBase().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = {downloadKnowledgeBase};
