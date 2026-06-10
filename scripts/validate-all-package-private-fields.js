#!/usr/bin/env node
'use strict';

/**
 * Scans all packages/ directories and validates that `private` field
 * (if present) is a boolean, per npm specification.
 * 
 * Usage: node scripts/validate-all-package-private-fields.js
 */

const fs = require('fs');
const path = require('path');

function validatePrivateField(packageJsonPath) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content);
  
  if ('private' in pkg) {
    if (typeof pkg.private !== 'boolean') {
      return {
        path: packageJsonPath,
        error: `private must be boolean, got ${typeof pkg.private} ("${pkg.private}")`
      };
    }
  }
  return null;
}

const packagesDir = 'packages';
const entries = fs.readdirSync(packagesDir);
const packages = entries.filter(e => {
  try {
    const stat = fs.statSync(path.join(packagesDir, e));
    return stat.isDirectory() && fs.existsSync(path.join(packagesDir, e, 'package.json'));
  } catch {
    return false;
  }
});

let hasError = false;
for (const pkgName of packages) {
  const pkgPath = path.join(packagesDir, pkgName, 'package.json');
  const error = validatePrivateField(pkgPath);
  if (error) {
    console.error(`ERROR: ${pkgName}: ${error.error}`);
    hasError = true;
  } else {
    console.log(`✓ ${pkgName}`);
  }
}

if (hasError) {
  console.error('\nValidation failed: some packages have invalid private fields');
  process.exit(1);
} else {
  console.log(`\nAll ${packages.length} packages passed validation`);
}
