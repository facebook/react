/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ParsedError, Solution } from './types';

/**
 * Display loading indicator with animated dots
 * Returns a cleanup function to stop the animation
 */
export function displayLoadingIndicator(): () => void {
  const cyan = '\x1b[36m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  
  let dotCount = 0;
  const maxDots = 3;
  let isCleared = false;
  
  // Show initial loading message
  console.log('\n' + cyan + '='.repeat(80) + reset);
  
  // Animate dots on a single line
  const interval = setInterval(() => {
    if (isCleared) {
      clearInterval(interval);
      return;
    }
    
    // Clear current line and write animated version
    process.stdout.write('\r\x1b[K'); // Clear line and return to start
    dotCount = (dotCount + 1) % (maxDots + 1);
    const dots = '.'.repeat(dotCount);
    const spaces = ' '.repeat(maxDots - dotCount);
    process.stdout.write(`${bold}${cyan}🔍 React Error Assistant - Researching${dots}${spaces}${reset}`);
  }, 500); // Update every 500ms
  
  // Return cleanup function
  return () => {
    if (isCleared) return;
    isCleared = true;
    clearInterval(interval);
    // Clear the loading line and move to new line
    process.stdout.write('\r\x1b[K\n');
  };
}

/**
 * Display solution in terminal
 */
export function displaySolution(parsedError: ParsedError, solution: Solution): void {
  // Use colors for better visibility
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const red = '\x1b[31m';
  const blue = '\x1b[34m';

  console.log('\n' + cyan + '='.repeat(80) + reset);
  console.log(bold + cyan + '🔍 React Error Assistant - Solution' + reset);
  console.log(cyan + '='.repeat(80) + reset);

  // Error summary
  console.log(`\n${red}❌ Error:${reset} ${bold}${parsedError.type}${reset}`);
  
  // Clean up message - remove stack trace noise, keep only the meaningful error
  const cleanMessage = cleanErrorMessage(parsedError.message);
  console.log(`   ${cleanMessage}`);
  
  if (parsedError.file) {
    console.log(`   ${blue}File:${reset} ${parsedError.file}${parsedError.line ? `:${parsedError.line}` : ''}`);
  }

  // Explanation
  if (solution.explanation) {
    console.log(`\n${green}💡 Explanation:${reset}`);
    console.log(`   ${solution.explanation}`);
  }

  // Cause
  if (solution.cause) {
    console.log(`\n${yellow}🔍 Likely Cause:${reset}`);
    console.log(`   ${solution.cause}`);
  }

  // Steps
  if (solution.steps && solution.steps.length > 0) {
    console.log(`\n${cyan}📋 Solution Steps:${reset}`);
    solution.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
  }

  // Code examples
  if (solution.codeExamples && solution.codeExamples.length > 0) {
    console.log(`\n${green}💻 Code Examples:${reset}`);
    solution.codeExamples.forEach((example, index) => {
      console.log(`\n   ${bold}Example ${index + 1}${example.description ? ` - ${example.description}` : ''}:${reset}`);
      console.log(`   ${cyan}\`\`\`${example.language}${reset}`);
      example.code.split('\n').forEach((line) => {
        console.log(`   ${line}`);
      });
      console.log(`   ${cyan}\`\`\`${reset}`);
    });
  }

  // Documentation links
  if (solution.documentationLinks && solution.documentationLinks.length > 0) {
    console.log(`\n${blue}📚 Documentation:${reset}`);
    solution.documentationLinks.forEach((link) => {
      console.log(`   ${cyan}${link}${reset}`);
    });
  }

  console.log('\n' + cyan + '='.repeat(80) + reset + '\n');
}

/**
 * Clean error message by removing stack trace noise
 * Keeps the meaningful error message, removes internal stack traces
 */
function cleanErrorMessage(message: string): string {
  // Remove stack trace patterns (lines starting with "at" or file paths)
  const lines = message.split('\n');
  const meaningfulLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip stack trace lines
    if (
      trimmed.startsWith('at ') ||
      trimmed.startsWith('at failureErrorWithLog') ||
      trimmed.startsWith('at C:') ||
      trimmed.startsWith('at new Promise') ||
      trimmed.includes('node_modules/esbuild') ||
      trimmed.includes('node_modules/vite') ||
      trimmed.match(/^\s*at\s+\w+/) // Matches "at functionName" pattern
    ) {
      continue;
    }
    // Keep meaningful error lines
    if (trimmed.length > 0) {
      meaningfulLines.push(trimmed);
    }
  }
  
  // If we filtered everything, return original (shouldn't happen)
  if (meaningfulLines.length === 0) {
    return message.split('\n')[0] || message; // Return first line only
  }
  
  // Return cleaned message (max 3 lines to avoid clutter)
  return meaningfulLines.slice(0, 3).join('\n   ');
}

