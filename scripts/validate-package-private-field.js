#!/usr/bin/env node
'use strict';

/**
 * Validates that the `private` field in package.json is a boolean.
 * Per npm specification, `private` must be a boolean value.
 * 
 * Usage: node scripts/validate-package-private-field.js <package-json-path>
 */

const fs = require('fs');
const path = require('path');

function validatePrivateField(packageJsonPath) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content);
  
  if ('private' in pkg) {
    if (typeof pkg.private !== 'boolean') {
      console.error(
        `ERROR: 'private' field in ${path.relative(process.cwd(), packageJsonPath)} ` +
        `must be a boolean, got ${typeof pkg.private} ("${pkg.private}")`
      );
      process.exit(1);
    }
    console.log(`✓ ${path.relative(process.cwd(), packageJsonPath)}: private=${pkg.private} (boolean)`);
  } else {
    console.log(`✓ ${path.relative(process.cwd(), packageJsonPath)}: no private field`);
  }
}

const pkgPath = process.argv[2];
if (!pkgPath) {
  console.error('Usage: node scripts/validate-package-private-field.js <package-json-path>');
  process.exit(1);
}

try {
  validatePrivateField(path.resolve(process.cwd(), pkgPath));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
