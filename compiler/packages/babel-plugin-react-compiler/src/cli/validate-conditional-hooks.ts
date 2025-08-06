#!/usr/bin/env node

/**
 * CLI Tool for React Conditional Hooks Validation
 * 
 * This allows developers to validate their React components against
 * conditional hook patterns from the command line.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

// Import our validation logic (in real usage these would be proper imports)
interface ValidationResult {
  filePath: string;
  violations: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    hookName: string;
    suggestionCount: number;
  }>;
  processingTime: number;
}

/**
 * Main CLI interface
 */
program
  .name('validate-conditional-hooks')
  .description('🔍 Validate React components for conditional hook usage patterns')
  .version('1.0.0');

program
  .command('check')
  .description('Check files for conditional hook violations')
  .argument('<files...>', 'Files or glob patterns to check')
  .option('-c, --config <config>', 'Configuration preset: strict, relaxed, development', 'default')
  .option('-f, --format <format>', 'Output format: console, json, junit', 'console')
  .option('-o, --output <file>', 'Output file for results')
  .option('--fix', 'Automatically fix violations where possible')
  .option('--performance', 'Enable performance monitoring')
  .option('--max-nesting <depth>', 'Maximum allowed nesting depth', '3')
  .action(async (files, options) => {
    console.log(chalk.blue('🔍 React Conditional Hooks Validator'));
    console.log(chalk.gray('Analyzing files for conditional hook patterns...\n'));
    
    const results = await validateFiles(files, options);
    await outputResults(results, options);
  });

program
  .command('fix')
  .description('Automatically fix conditional hook violations')
  .argument('<files...>', 'Files or glob patterns to fix')
  .option('-c, --config <config>', 'Configuration preset', 'default')
  .option('--backup', 'Create backup files before fixing')
  .action(async (files, options) => {
    console.log(chalk.yellow('🔧 Auto-fixing conditional hook violations...'));
    
    const results = await fixFiles(files, options);
    console.log(chalk.green(`✅ Fixed ${results.fixedCount} violations in ${results.fileCount} files`));
  });

program
  .command('analyze')
  .description('Analyze codebase for hook usage patterns')
  .argument('<directory>', 'Directory to analyze')
  .option('--recursive', 'Analyze subdirectories recursively', true)
  .option('--report <file>', 'Generate detailed report file')
  .action(async (directory, options) => {
    console.log(chalk.cyan('📊 Analyzing hook usage patterns...'));
    
    const analysis = await analyzeCodebase(directory, options);
    await generateAnalysisReport(analysis, options);
  });

/**
 * Validate files for conditional hook violations
 */
async function validateFiles(filePatterns: string[], options: any): Promise<ValidationResult[]> {
  const files = await expandFilePatterns(filePatterns);
  const results: ValidationResult[] = [];
  
  console.log(chalk.gray(`Found ${files.length} files to validate\n`));
  
  for (const filePath of files) {
    const startTime = performance.now();
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const violations = await validateFileContent(content, filePath, options);
      const processingTime = performance.now() - startTime;
      
      results.push({
        filePath,
        violations,
        processingTime
      });
      
      // Progress indication
      const status = violations.length > 0 
        ? chalk.red(`✗ ${violations.length} violations`)
        : chalk.green('✓ clean');
      
      console.log(`${status} ${chalk.gray(filePath)} ${chalk.yellow(`(${processingTime.toFixed(2)}ms)`)}`);
      
    } catch (error) {
      console.log(chalk.red(`✗ Error processing ${filePath}: ${error.message}`));
    }
  }
  
  return results;
}

/**
 * Validate individual file content
 */
async function validateFileContent(
  content: string, 
  filePath: string, 
  options: any
): Promise<ValidationResult['violations']> {
  // This would integrate with our actual validation plugin
  // For now, we'll simulate the detection with pattern matching
  
  const violations: ValidationResult['violations'][] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Detect conditional hook patterns
    const conditionalHookMatch = /if\s*\([^)]+\)\s*{[^}]*use[A-Z]\w*\s*\(/.exec(line);
    if (conditionalHookMatch) {
      violations.push({
        line: lineNumber,
        column: conditionalHookMatch.index + 1,
        message: 'Hook called conditionally inside if statement',
        severity: 'error',
        hookName: extractHookName(conditionalHookMatch[0]),
        suggestionCount: 2
      });
    }
    
    // Detect early return pattern
    if (line.includes('return null') || line.includes('return;')) {
      // Look for hooks in subsequent lines
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const subsequentLine = lines[j];
        const hookMatch = /use[A-Z]\w*\s*\(/.exec(subsequentLine);
        if (hookMatch) {
          violations.push({
            line: j + 1,
            column: hookMatch.index + 1,
            message: 'Hook called after early return (PR #34116 pattern)',
            severity: 'error',
            hookName: extractHookName(hookMatch[0]),
            suggestionCount: 3
          });
          break;
        }
      }
    }
  }
  
  return violations;
}

/**
 * Extract hook name from matched pattern
 */
function extractHookName(match: string): string {
  const hookMatch = /use[A-Z]\w*/.exec(match);
  return hookMatch ? hookMatch[0] : 'unknown hook';
}

/**
 * Output validation results in specified format
 */
async function outputResults(results: ValidationResult[], options: any): Promise<void> {
  const totalViolations = results.reduce((sum, result) => sum + result.violations.length, 0);
  const totalFiles = results.length;
  const violatedFiles = results.filter(r => r.violations.length > 0).length;
  
  console.log('\n' + chalk.blue('📋 Validation Summary'));
  console.log(chalk.gray('────────────────────────────'));
  console.log(`Files analyzed: ${chalk.cyan(totalFiles)}`);
  console.log(`Files with violations: ${chalk.red(violatedFiles)}`);
  console.log(`Total violations: ${chalk.red(totalViolations)}`);
  
  if (totalViolations > 0) {
    console.log('\n' + chalk.red('❌ Conditional hook violations found:'));
    
    for (const result of results) {
      if (result.violations.length > 0) {
        console.log(`\n${chalk.underline(result.filePath)}`);
        
        for (const violation of result.violations) {
          const location = chalk.gray(`${violation.line}:${violation.column}`);
          const severity = violation.severity === 'error' 
            ? chalk.red('error') 
            : chalk.yellow('warning');
          
          console.log(`  ${location} ${severity} ${violation.message}`);
          console.log(`    ${chalk.dim(`Hook: ${violation.hookName}, ${violation.suggestionCount} fix suggestions available`)}`);
        }
      }
    }
  } else {
    console.log(chalk.green('\n✅ No conditional hook violations found!'));
  }
  
  // Performance summary
  const totalTime = results.reduce((sum, result) => sum + result.processingTime, 0);
  console.log(chalk.gray(`\nProcessing time: ${totalTime.toFixed(2)}ms`));
  
  // Output to file if specified
  if (options.output) {
    const outputData = options.format === 'json' 
      ? JSON.stringify(results, null, 2)
      : formatAsJUnit(results);
    
    writeFileSync(options.output, outputData);
    console.log(chalk.green(`\n📄 Results written to ${options.output}`));
  }
}

/**
 * Auto-fix violations where possible
 */
async function fixFiles(filePatterns: string[], options: any): Promise<{ fixedCount: number; fileCount: number }> {
  const files = await expandFilePatterns(filePatterns);
  let fixedCount = 0;
  let fileCount = 0;
  
  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { fixedContent, fixes } = await applyAutoFixes(content, options);
      
      if (fixes > 0) {
        if (options.backup) {
          writeFileSync(`${filePath}.backup`, content);
        }
        
        writeFileSync(filePath, fixedContent);
        fixedCount += fixes;
        fileCount++;
        
        console.log(chalk.green(`✅ Fixed ${fixes} violations in ${filePath}`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error fixing ${filePath}: ${error.message}`));
    }
  }
  
  return { fixedCount, fileCount };
}

/**
 * Apply automatic fixes to code
 */
async function applyAutoFixes(content: string, options: any): Promise<{ fixedContent: string; fixes: number }> {
  let fixedContent = content;
  let fixes = 0;
  
  // Example fix: Move hooks before early returns
  fixedContent = fixedContent.replace(
    /(if\s*\([^)]+\)\s*{\s*return\s+[^;]+;?\s*}\s*)(const\s+\[[^\]]+\]\s*=\s*use[A-Z]\w*\([^)]*\);?)/g,
    (match, earlyReturn, hookCall) => {
      fixes++;
      return `${hookCall}\n  ${earlyReturn}`;
    }
  );
  
  return { fixedContent, fixes };
}

/**
 * Analyze entire codebase for hook patterns
 */
async function analyzeCodebase(directory: string, options: any): Promise<any> {
  const files = await glob('**/*.{js,jsx,ts,tsx}', { cwd: directory });
  
  const analysis = {
    totalFiles: files.length,
    hooksFound: 0,
    conditionalViolations: 0,
    commonPatterns: new Map(),
    performanceMetrics: {}
  };
  
  // Analyze each file
  for (const file of files) {
    const filePath = resolve(directory, file);
    const content = readFileSync(filePath, 'utf-8');
    
    // Count hooks
    const hookMatches = content.match(/use[A-Z]\w*\s*\(/g) || [];
    analysis.hooksFound += hookMatches.length;
    
    // Track patterns
    for (const hook of hookMatches) {
      const hookName = hook.replace(/\s*\($/, '');
      analysis.commonPatterns.set(
        hookName, 
        (analysis.commonPatterns.get(hookName) || 0) + 1
      );
    }
  }
  
  return analysis;
}

/**
 * Generate detailed analysis report
 */
async function generateAnalysisReport(analysis: any, options: any): Promise<void> {
  console.log(chalk.cyan('\n📊 Codebase Analysis Results'));
  console.log(chalk.gray('───────────────────────────────'));
  console.log(`Total files analyzed: ${chalk.cyan(analysis.totalFiles)}`);
  console.log(`Total hooks found: ${chalk.cyan(analysis.hooksFound)}`);
  
  console.log('\n' + chalk.cyan('🔝 Most used hooks:'));
  const sortedHooks = Array.from(analysis.commonPatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [hook, count] of sortedHooks) {
    console.log(`  ${hook}: ${chalk.yellow(count)} uses`);
  }
  
  if (options.report) {
    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      recommendations: generateRecommendations(analysis)
    };
    
    writeFileSync(options.report, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n📄 Detailed report saved to ${options.report}`));
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.conditionalViolations > 0) {
    recommendations.push('⚠️  Consider running the fix command to automatically resolve conditional hook violations');
  }
  
  if (analysis.hooksFound > 100) {
    recommendations.push('📊 Large number of hooks detected - consider performance monitoring');
  }
  
  return recommendations;
}

/**
 * Expand file patterns to actual file paths
 */
async function expandFilePatterns(patterns: string[]): Promise<string[]> {
  const files: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, { 
      ignore: ['node_modules/**', 'dist/**', 'build/**'] 
    });
    files.push(...matches);
  }
  
  return [...new Set(files)]; // Remove duplicates
}

/**
 * Format results as JUnit XML
 */
function formatAsJUnit(results: ValidationResult[]): string {
  const totalTests = results.length;
  const failures = results.filter(r => r.violations.length > 0).length;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuite name="ConditionalHooksValidation" tests="${totalTests}" failures="${failures}">\n`;
  
  for (const result of results) {
    xml += `  <testcase name="${result.filePath}" time="${result.processingTime / 1000}">\n`;
    
    if (result.violations.length > 0) {
      for (const violation of result.violations) {
        xml += `    <failure message="${violation.message}" type="${violation.severity}">\n`;
        xml += `      ${violation.hookName} at line ${violation.line}:${violation.column}\n`;
        xml += `    </failure>\n`;
      }
    }
    
    xml += `  </testcase>\n`;
  }
  
  xml += `</testsuite>`;
  return xml;
}

// Run the CLI
if (require.main === module) {
  program.parse();
}

export { validateFiles, fixFiles, analyzeCodebase };
