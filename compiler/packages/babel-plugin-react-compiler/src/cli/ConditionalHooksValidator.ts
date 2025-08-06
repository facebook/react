/**
 * CLI Tool for React Conditional Hooks Validation
 * 
 * Production-ready command line interface for validating React components
 * against conditional hook usage patterns.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';

// Import our validation types and logic
interface ValidationResult {
  filePath: string;
  violations: ViolationDetail[];
  processingTime: number;
  linesOfCode: number;
}

interface ViolationDetail {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  hookName: string;
  suggestionCount: number;
  fixable: boolean;
}

interface CliOptions {
  config: 'strict' | 'relaxed' | 'development' | 'default';
  format: 'console' | 'json' | 'junit';
  output?: string;
  fix: boolean;
  performance: boolean;
  maxNesting: number;
  backup: boolean;
  recursive: boolean;
  report?: string;
}

/**
 * Main CLI class for handling command-line operations
 */
export class ConditionalHooksValidator {
  private options: Partial<CliOptions>;

  constructor(options: Partial<CliOptions> = {}) {
    this.options = {
      config: 'default',
      format: 'console',
      fix: false,
      performance: false,
      maxNesting: 3,
      backup: false,
      recursive: true,
      ...options
    };
  }

  /**
   * Validate files for conditional hook violations
   */
  async validateFiles(patterns: string[]): Promise<ValidationResult[]> {
    console.log('🔍 React Conditional Hooks Validator');
    console.log('Analyzing files for conditional hook patterns...\n');
    
    const files = this.expandFilePatterns(patterns);
    const results: ValidationResult[] = [];
    
    console.log(`Found ${files.length} files to validate\n`);
    
    for (const filePath of files) {
      const startTime = performance.now();
      
      try {
        const content = readFileSync(filePath, 'utf-8');
        const violations = this.validateFileContent(content, filePath);
        const processingTime = performance.now() - startTime;
        const linesOfCode = content.split('\n').length;
        
        results.push({
          filePath,
          violations,
          processingTime,
          linesOfCode
        });
        
        // Progress indication
        const status = violations.length > 0 
          ? `✗ ${violations.length} violations`
          : '✓ clean';
        
        console.log(`${status} ${filePath} (${processingTime.toFixed(2)}ms)`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`✗ Error processing ${filePath}: ${errorMessage}`);
      }
    }
    
    return results;
  }

  /**
   * Validate individual file content for conditional hook patterns
   */
  private validateFileContent(content: string, filePath: string): ViolationDetail[] {
    const violations: ViolationDetail[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Pattern 1: Hook inside if statement (direct conditional)
      const conditionalHookMatch = /if\s*\([^)]+\)\s*{[^}]*use[A-Z]\w*\s*\(/.exec(line);
      if (conditionalHookMatch) {
        violations.push({
          line: lineNumber,
          column: conditionalHookMatch.index + 1,
          message: 'Hook called conditionally inside if statement',
          severity: 'error',
          hookName: this.extractHookName(conditionalHookMatch[0]),
          suggestionCount: 2,
          fixable: true
        });
      }
      
      // Pattern 2: Hook inside ternary operator
      const ternaryHookMatch = /\?[^:]*use[A-Z]\w*\s*\(/.exec(line);
      if (ternaryHookMatch) {
        violations.push({
          line: lineNumber,
          column: ternaryHookMatch.index + 1,
          message: 'Hook called conditionally in ternary expression',
          severity: 'error',
          hookName: this.extractHookName(ternaryHookMatch[0]),
          suggestionCount: 1,
          fixable: false
        });
      }
      
      // Pattern 3: Early return pattern (PR #34116 specific)
      if (line.includes('return null') || line.includes('return;')) {
        // Look for hooks in subsequent lines within reasonable range
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const subsequentLine = lines[j];
          const hookMatch = /use[A-Z]\w*\s*\(/.exec(subsequentLine);
          if (hookMatch) {
            violations.push({
              line: j + 1,
              column: hookMatch.index + 1,
              message: 'Hook called after early return (PR #34116 pattern)',
              severity: 'error',
              hookName: this.extractHookName(hookMatch[0]),
              suggestionCount: 3,
              fixable: true
            });
            break; // Only report first occurrence per early return
          }
        }
      }
      
      // Pattern 4: Hook inside loop
      const loopHookMatch = /(for|while)\s*\([^)]*\)[^{]*{[^}]*use[A-Z]\w*\s*\(/.exec(line);
      if (loopHookMatch) {
        violations.push({
          line: lineNumber,
          column: loopHookMatch.index + 1,
          message: 'Hook called inside loop',
          severity: 'error',
          hookName: this.extractHookName(loopHookMatch[0]),
          suggestionCount: 1,
          fixable: false
        });
      }
      
      // Pattern 5: Nested function with hooks
      if (line.includes('function') && !line.includes('export') && !line.includes('const')) {
        // Look for hooks in the function body
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const funcLine = lines[j];
          if (funcLine.includes('}')) break; // End of function
          
          const nestedHookMatch = /use[A-Z]\w*\s*\(/.exec(funcLine);
          if (nestedHookMatch) {
            violations.push({
              line: j + 1,
              column: nestedHookMatch.index + 1,
              message: 'Hook called inside nested function',
              severity: 'warning',
              hookName: this.extractHookName(nestedHookMatch[0]),
              suggestionCount: 2,
              fixable: false
            });
          }
        }
      }
    }
    
    return violations;
  }

  /**
   * Extract hook name from matched pattern
   */
  private extractHookName(match: string): string {
    const hookMatch = /use[A-Z]\w*/.exec(match);
    return hookMatch ? hookMatch[0] : 'unknown hook';
  }

  /**
   * Automatically fix violations where possible
   */
  async fixFiles(patterns: string[]): Promise<{ fixedCount: number; fileCount: number }> {
    console.log('🔧 Auto-fixing conditional hook violations...');
    
    const files = this.expandFilePatterns(patterns);
    let fixedCount = 0;
    let fileCount = 0;
    
    for (const filePath of files) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const { fixedContent, fixes } = this.applyAutoFixes(content);
        
        if (fixes > 0) {
          if (this.options.backup) {
            writeFileSync(`${filePath}.backup`, content);
          }
          
          writeFileSync(filePath, fixedContent);
          fixedCount += fixes;
          fileCount++;
          
          console.log(`✅ Fixed ${fixes} violations in ${filePath}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Error fixing ${filePath}: ${errorMessage}`);
      }
    }
    
    return { fixedCount, fileCount };
  }

  /**
   * Apply automatic fixes to code content
   */
  private applyAutoFixes(content: string): { fixedContent: string; fixes: number } {
    let fixedContent = content;
    let fixes = 0;
    
    // Fix 1: Move hooks before early returns
    const earlyReturnPattern = /(if\s*\([^)]+\)\s*{\s*return\s+[^;]+;?\s*}\s*)(const\s+\[[^\]]+\]\s*=\s*use[A-Z]\w*\([^)]*\);?)/g;
    fixedContent = fixedContent.replace(earlyReturnPattern, (match, earlyReturn, hookCall) => {
      fixes++;
      return `${hookCall}\n  ${earlyReturn}`;
    });
    
    // Fix 2: Extract hooks from simple conditionals
    const simpleConditionalPattern = /if\s*\(([^)]+)\)\s*{\s*(const\s+\w+\s*=\s*use[A-Z]\w*\([^)]*\);?)\s*}/g;
    fixedContent = fixedContent.replace(simpleConditionalPattern, (match, condition, hookCall) => {
      fixes++;
      return `${hookCall}\n  if (${condition}) {\n    // Hook moved outside conditional\n  }`;
    });
    
    return { fixedContent, fixes };
  }

  /**
   * Analyze entire codebase for hook usage patterns
   */
  async analyzeCodebase(directory: string): Promise<any> {
    console.log('📊 Analyzing hook usage patterns...');
    
    const files = this.findReactFiles(directory);
    
    const analysis = {
      totalFiles: files.length,
      hooksFound: 0,
      conditionalViolations: 0,
      commonPatterns: new Map<string, number>(),
      performanceMetrics: {
        avgProcessingTime: 0,
        totalLinesAnalyzed: 0
      },
      recommendations: [] as string[]
    };
    
    let totalProcessingTime = 0;
    
    // Analyze each file
    for (const file of files) {
      const startTime = performance.now();
      const content = readFileSync(file, 'utf-8');
      
      // Count hooks
      const hookMatches = content.match(/use[A-Z]\w*\s*\(/g) || [];
      analysis.hooksFound += hookMatches.length;
      
      // Track common patterns
      for (const hook of hookMatches) {
        const hookName = hook.replace(/\s*\($/, '');
        analysis.commonPatterns.set(
          hookName, 
          (analysis.commonPatterns.get(hookName) || 0) + 1
        );
      }
      
      // Check for violations
      const violations = this.validateFileContent(content, file);
      analysis.conditionalViolations += violations.length;
      
      const processingTime = performance.now() - startTime;
      totalProcessingTime += processingTime;
      analysis.performanceMetrics.totalLinesAnalyzed += content.split('\n').length;
    }
    
    analysis.performanceMetrics.avgProcessingTime = totalProcessingTime / files.length;
    analysis.recommendations = this.generateRecommendations(analysis);
    
    return analysis;
  }

  /**
   * Output results in the specified format
   */
  outputResults(results: ValidationResult[]): void {
    const totalViolations = results.reduce((sum, result) => sum + result.violations.length, 0);
    const totalFiles = results.length;
    const violatedFiles = results.filter(r => r.violations.length > 0).length;
    const totalLinesAnalyzed = results.reduce((sum, result) => sum + result.linesOfCode, 0);
    
    console.log('\n📋 Validation Summary');
    console.log('────────────────────────────');
    console.log(`Files analyzed: ${totalFiles}`);
    console.log(`Lines of code: ${totalLinesAnalyzed}`);
    console.log(`Files with violations: ${violatedFiles}`);
    console.log(`Total violations: ${totalViolations}`);
    
    if (totalViolations > 0) {
      console.log('\n❌ Conditional hook violations found:');
      
      for (const result of results) {
        if (result.violations.length > 0) {
          console.log(`\n${result.filePath}`);
          
          for (const violation of result.violations) {
            const location = `${violation.line}:${violation.column}`;
            const severity = violation.severity === 'error' ? 'error' : 'warning';
            const fixStatus = violation.fixable ? '(auto-fixable)' : '(manual fix required)';
            
            console.log(`  ${location} ${severity} ${violation.message} ${fixStatus}`);
            console.log(`    Hook: ${violation.hookName}, ${violation.suggestionCount} suggestions available`);
          }
        }
      }
      
      console.log('\n💡 Run with --fix flag to automatically resolve fixable violations');
    } else {
      console.log('\n✅ No conditional hook violations found!');
    }
    
    // Performance summary
    if (this.options.performance) {
      const totalTime = results.reduce((sum, result) => sum + result.processingTime, 0);
      const avgTime = totalTime / results.length;
      console.log(`\n⚡ Performance: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
    }
    
    // Output to file if specified
    if (this.options.output) {
      const outputData = this.options.format === 'json' 
        ? JSON.stringify(results, null, 2)
        : this.formatAsJUnit(results);
      
      writeFileSync(this.options.output, outputData);
      console.log(`\n📄 Results written to ${this.options.output}`);
    }
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport(analysis: any): void {
    console.log('\n📊 Codebase Analysis Results');
    console.log('───────────────────────────────');
    console.log(`Total files analyzed: ${analysis.totalFiles}`);
    console.log(`Total hooks found: ${analysis.hooksFound}`);
    console.log(`Conditional violations: ${analysis.conditionalViolations}`);
    console.log(`Average processing time: ${analysis.performanceMetrics.avgProcessingTime.toFixed(2)}ms`);
    console.log(`Total lines analyzed: ${analysis.performanceMetrics.totalLinesAnalyzed}`);
    
    console.log('\n🔝 Most used hooks:');
    const hookEntries = Array.from(analysis.commonPatterns.entries()) as [string, number][];
    const sortedHooks = hookEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [hook, count] of sortedHooks) {
      console.log(`  ${hook}: ${count} uses`);
    }
    
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const recommendation of analysis.recommendations) {
        console.log(`  ${recommendation}`);
      }
    }
    
    if (this.options.report) {
      const report = {
        timestamp: new Date().toISOString(),
        analysis,
        summary: {
          violationRate: (analysis.conditionalViolations / analysis.totalFiles * 100).toFixed(2) + '%',
          hooksPerFile: (analysis.hooksFound / analysis.totalFiles).toFixed(1)
        }
      };
      
      writeFileSync(this.options.report, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to ${this.options.report}`);
    }
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.conditionalViolations > 0) {
      recommendations.push('⚠️  Run the fix command to automatically resolve conditional hook violations');
    }
    
    if (analysis.conditionalViolations > analysis.totalFiles * 0.1) {
      recommendations.push('📚 Consider team training on Rules of Hooks');
    }
    
    if (analysis.hooksFound > analysis.totalFiles * 5) {
      recommendations.push('🔍 High hook usage detected - consider performance monitoring');
    }
    
    if (analysis.performanceMetrics.avgProcessingTime > 10) {
      recommendations.push('⚡ Consider running analysis in parallel for better performance');
    }
    
    return recommendations;
  }

  /**
   * Expand file patterns to actual file paths
   */
  private expandFilePatterns(patterns: string[]): string[] {
    const files: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        // Simple glob expansion - in production would use proper glob library
        files.push(...this.findReactFiles('.'));
      } else {
        // Direct file path
        if (this.isReactFile(pattern)) {
          files.push(resolve(pattern));
        }
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Find all React files in directory
   */
  private findReactFiles(directory: string): string[] {
    const reactFiles: string[] = [];
    
    const searchDirectory = (dir: string) => {
      try {
        const items = readdirSync(dir);
        
        for (const item of items) {
          const itemPath = join(dir, item);
          const stat = statSync(itemPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules and build directories
            if (!['node_modules', 'dist', 'build', '.git'].includes(item) && this.options.recursive) {
              searchDirectory(itemPath);
            }
          } else if (this.isReactFile(itemPath)) {
            reactFiles.push(resolve(itemPath));
          }
        }
      } catch (error) {
        // Ignore permission errors etc.
      }
    };
    
    searchDirectory(directory);
    return reactFiles;
  }

  /**
   * Check if file is a React file
   */
  private isReactFile(filePath: string): boolean {
    const ext = extname(filePath);
    return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
  }

  /**
   * Format results as JUnit XML for CI integration
   */
  private formatAsJUnit(results: ValidationResult[]): string {
    const totalTests = results.length;
    const failures = results.filter(r => r.violations.length > 0).length;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuite name="ConditionalHooksValidation" tests="${totalTests}" failures="${failures}">\n`;
    
    for (const result of results) {
      xml += `  <testcase name="${result.filePath}" time="${(result.processingTime / 1000).toFixed(3)}">\n`;
      
      if (result.violations.length > 0) {
        for (const violation of result.violations) {
          xml += `    <failure message="${violation.message}" type="${violation.severity}">\n`;
          xml += `      ${violation.hookName} at line ${violation.line}:${violation.column}\n`;
          xml += `      Suggestions: ${violation.suggestionCount}, Fixable: ${violation.fixable}\n`;
          xml += `    </failure>\n`;
        }
      }
      
      xml += `  </testcase>\n`;
    }
    
    xml += `</testsuite>`;
    return xml;
  }
}

// Example usage functions for different CLI commands
export async function validateCommand(files: string[], options: Partial<CliOptions> = {}) {
  const validator = new ConditionalHooksValidator(options);
  const results = await validator.validateFiles(files);
  validator.outputResults(results);
  return results;
}

export async function fixCommand(files: string[], options: Partial<CliOptions> = {}) {
  const validator = new ConditionalHooksValidator(options);
  const result = await validator.fixFiles(files);
  console.log(`✅ Fixed ${result.fixedCount} violations in ${result.fileCount} files`);
  return result;
}

export async function analyzeCommand(directory: string, options: Partial<CliOptions> = {}) {
  const validator = new ConditionalHooksValidator(options);
  const analysis = await validator.analyzeCodebase(directory);
  validator.generateAnalysisReport(analysis);
  return analysis;
}
