#!/usr/bin/env node

/**
 * TypeScript Migration Helper Script
 * 
 * Automates the migration of a React package from Flow to TypeScript.
 * 
 * Usage:
 *   node scripts/typescript/migrate-package.js <package-name>
 * 
 * Example:
 *   node scripts/typescript/migrate-package.js react-is
 * 
 * This script will:
 * 1. Create a tsconfig.json for the package
 * 2. Rename .js files to .ts/.tsx
 * 3. Remove Flow annotations
 * 4. Create a migration checklist
 * 
 * Note: Manual type conversion is still required!
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const PACKAGES_DIR = path.join(__dirname, '../../packages');

function main() {
  const packageName = process.argv[2];
  
  if (!packageName) {
    console.error('Usage: node migrate-package.js <package-name>');
    process.exit(1);
  }
  
  const packageDir = path.join(PACKAGES_DIR, packageName);
  
  if (!fs.existsSync(packageDir)) {
    console.error(`Package not found: ${packageName}`);
    console.error(`Expected at: ${packageDir}`);
    process.exit(1);
  }
  
  console.log(`\n🚀 Starting TypeScript migration for: ${packageName}\n`);
  
  // Step 1: Create tsconfig.json
  createTsConfig(packageDir, packageName);
  
  // Step 2: List files to rename
  listFilesToRename(packageDir);
  
  // Step 3: Create migration checklist
  createMigrationChecklist(packageDir, packageName);
  
  console.log('\n✅ Migration setup complete!\n');
  console.log('Next steps:');
  console.log('1. Review the generated tsconfig.json');
  console.log('2. Rename .js files to .ts/.tsx (see files-to-rename.txt)');
  console.log('3. Remove Flow annotations');
  console.log('4. Convert Flow types to TypeScript');
  console.log('5. Run: yarn tsc --noEmit');
  console.log('6. Run: yarn test ' + packageName);
  console.log('\nSee MIGRATION_CHECKLIST.md for full details.\n');
}

function createTsConfig(packageDir, packageName) {
  const tsconfigPath = path.join(packageDir, 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    console.log('⚠️  tsconfig.json already exists, skipping...');
    return;
  }
  
  const tsconfig = {
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      outDir: './build',
      rootDir: './src',
      types: ['node'],
    },
    include: ['src/**/*'],
    exclude: ['**/__tests__/**', '**/*.spec.ts', '**/*.test.ts'],
  };
  
  fs.writeFileSync(
    tsconfigPath,
    JSON.stringify(tsconfig, null, 2) + '\n'
  );
  
  console.log('✓ Created tsconfig.json');
}

function listFilesToRename(packageDir) {
  const srcDir = path.join(packageDir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log('⚠️  No src directory found');
    return;
  }
  
  const jsFiles = [];
  
  function findJsFiles(dir) {
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        findJsFiles(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const relativePath = path.relative(packageDir, fullPath);
        const hasJSX = checkForJSX(fullPath);
        const newExt = hasJSX ? '.tsx' : '.ts';
        const newPath = fullPath.replace(/\.js$/, newExt);
        
        jsFiles.push({
          old: relativePath,
          new: path.relative(packageDir, newPath),
          hasJSX,
        });
      }
    }
  }
  
  findJsFiles(srcDir);
  
  if (jsFiles.length === 0) {
    console.log('⚠️  No .js files found to rename');
    return;
  }
  
  const outputPath = path.join(packageDir, 'files-to-rename.txt');
  const output = jsFiles
    .map(f => `${f.old} -> ${f.new}${f.hasJSX ? ' (contains JSX)' : ''}`)
    .join('\n');
  
  fs.writeFileSync(outputPath, output + '\n');
  
  console.log(`✓ Listed ${jsFiles.length} files to rename (see files-to-rename.txt)`);
}

function checkForJSX(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple heuristic: check for JSX patterns
  return /<[A-Z]/.test(content) || /React\.createElement/.test(content);
}

function createMigrationChecklist(packageDir, packageName) {
  const checklistPath = path.join(packageDir, 'MIGRATION_CHECKLIST.md');
  
  const checklist = `# TypeScript Migration Checklist: ${packageName}

## Preparation
- [ ] Read [TypeScript Migration Guide](../../docs/contributing/typescript-migration.md)
- [ ] Create branch: \`git checkout -b migrate-${packageName}-to-typescript\`

## Setup
- [x] Create tsconfig.json
- [ ] Review tsconfig.json settings
- [ ] Update package.json if needed

## Migration
- [ ] Rename .js files to .ts/.tsx (see files-to-rename.txt)
- [ ] Remove Flow annotations (\`// @flow\`, \`import type\`)
- [ ] Convert Flow types to TypeScript
- [ ] Fix TypeScript compilation errors
- [ ] Ensure strict mode compliance

## Validation
- [ ] \`yarn tsc --noEmit\` - no errors
- [ ] \`yarn test ${packageName}\` - all tests pass
- [ ] \`yarn build ${packageName}\` - builds successfully
- [ ] Verify type declarations generated
- [ ] Check no runtime behavior changes

## Documentation
- [ ] Update README if needed
- [ ] Document migration challenges
- [ ] Add comments for complex conversions

## Submission
- [ ] Create PR with descriptive title
- [ ] Link to tracking issue
- [ ] Fill out PR template
- [ ] Request review

## Notes

Add any migration-specific notes here:

- 
`;
  
  fs.writeFileSync(checklistPath, checklist);
  
  console.log('✓ Created MIGRATION_CHECKLIST.md');
}

main();
