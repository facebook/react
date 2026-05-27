'use strict';

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

async function main() {
  const originalJSON = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../error-codes/codes.json'))
  );
  const existingMessages = new Set();
  const codes = Object.keys(originalJSON);
  let nextCode = 0;
  for (let i = 0; i < codes.length; i++) {
    const codeStr = codes[i];
    const message = originalJSON[codeStr];
    const code = parseInt(codeStr, 10);
    existingMessages.add(message);
    if (code >= nextCode) {
      nextCode = code + 1;
    }
  }

  console.log('Searching `build` directory for unminified errors...\n');

  let out;
  try {
    out = execSync(
      "git --no-pager grep -n --untracked --no-exclude-standard '/*! <expected-error-format>' -- build"
    ).toString();
  } catch (e) {
    if (e.status === 1 && e.stdout.toString() === '') {
      // No unminified errors found.
      return;
    }
    throw e;
  }

  let newJSON = null;
  const regex = /\<expected-error-format\>"(.+?)"\<\/expected-error-format\>/g;
  do {
    const match = regex.exec(out);
    if (match === null) {
      break;
    } else {
      const message = match[1].trim();
      if (existingMessages.has(message)) {
        // This probably means you ran the script twice.
        continue;
      }
      existingMessages.add(message);

      // Add to json map
      if (newJSON === null) {
        newJSON = Object.assign({}, originalJSON);
      }
      console.log(`"${nextCode}": "${message}"`);
      newJSON[nextCode] = message;
      nextCode += 1;
    }
  } while (true);

  if (newJSON) {
    fs.writeFileSync(
      path.resolve(__dirname, '../error-codes/codes.json'),
      JSON.stringify(newJSON, null, 2)
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
