/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PythonBridge } from '../bridge/python-bridge';
import { parseError } from './parser';
import { extractContext } from './context-extractor';
import { displaySolution, displayLoadingIndicator } from '../display';
import type { ParsedError } from '../types';

/**
 * Intercepts and processes Vite errors
 */
export class ErrorInterceptor {
  private pythonBridge: PythonBridge | null;
  // Track errors we've shown solutions for to avoid duplicates
  private shownErrors: Set<string> = new Set();
  // Track errors currently being processed to prevent concurrent processing
  private processingErrors: Set<string> = new Set();
  // Track loading indicators to prevent duplicates
  private activeLoadingIndicators: Map<string, () => void> = new Map();

  constructor(pythonBridge: PythonBridge | null) {
    this.pythonBridge = pythonBridge;
  }

  /**
   * Generate a unique hash for an error to track if we've shown it
   * Normalizes the message to catch duplicates from different sources
   */
  private getErrorHash(parsedError: ParsedError): string {
    // Normalize message: extract key error phrases, remove file paths, normalize whitespace
    let normalizedMessage = parsedError.message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract key error phrases (e.g., "failed to resolve import")
    const keyPhrases = [
      'failed to resolve',
      'cannot find module',
      'module not found',
      'syntax error',
      'parse error',
      'transform failed',
    ];
    
    for (const phrase of keyPhrases) {
      if (normalizedMessage.includes(phrase)) {
        normalizedMessage = phrase;
        break;
      }
    }
    
    // Create hash from error type, file, and normalized message
    const key = `${parsedError.type}:${parsedError.file || 'unknown'}:${parsedError.line || 0}:${normalizedMessage.substring(0, 50)}`;
    return key;
  }

  /**
   * Clear error tracking (call when file changes or errors are fixed)
   */
  clearErrorTracking(): void {
    this.shownErrors.clear();
    this.processingErrors.clear();
    // Clear all active loading indicators
    this.activeLoadingIndicators.forEach((clearFn) => clearFn());
    this.activeLoadingIndicators.clear();
  }

  /**
   * Handle a Vite error
   */
  async handleError(error: Error | unknown): Promise<void> {
    try {
      // Parse error
      const parsedError = parseError(error);
      
      // Generate error hash
      const errorHash = this.getErrorHash(parsedError);
      
      // Check if we've already shown a solution for this error
      if (this.shownErrors.has(errorHash)) {
        // Already shown - skip to avoid duplicates
        return;
      }
      
      // Check if we're currently processing this error
      if (this.processingErrors.has(errorHash)) {
        // Already processing - skip to avoid concurrent processing
        return;
      }
      
      // Mark as processing
      this.processingErrors.add(errorHash);
      
      // Extract context
      const context = extractContext(parsedError);

      // If Python bridge is available, get solution from RAG pipeline
      if (this.pythonBridge && this.pythonBridge.isServerRunning()) {
        // Show loading indicator only if we don't already have one for this error
        if (!this.activeLoadingIndicators.has(errorHash)) {
          const clearLoading = displayLoadingIndicator();
          this.activeLoadingIndicators.set(errorHash, clearLoading);
        }
        
        try {
          const solution = await this.pythonBridge.analyzeError(parsedError, context);
          
          // Clear loading indicator
          const clearLoading = this.activeLoadingIndicators.get(errorHash);
          if (clearLoading) {
            clearLoading();
            this.activeLoadingIndicators.delete(errorHash);
          }
          
          // Mark as shown
          this.shownErrors.add(errorHash);
          
          if (solution) {
            displaySolution(parsedError, solution);
          }
        } catch (ragError) {
          // Clear loading indicator on error
          const clearLoading = this.activeLoadingIndicators.get(errorHash);
          if (clearLoading) {
            clearLoading();
            this.activeLoadingIndicators.delete(errorHash);
          }
          
          // Mark as shown (even if failed, to prevent retry loops)
          this.shownErrors.add(errorHash);
          
          // RAG failed, but don't crash - suppress timeout errors to avoid spam
          const errorMessage = ragError instanceof Error ? ragError.message : String(ragError);
          if (!errorMessage.includes('timeout')) {
            // Only log non-timeout errors to avoid spam
            console.warn(
              '[react-error-assistant] RAG pipeline failed:',
              errorMessage
            );
          }
        } finally {
          // Always remove from processing set
          this.processingErrors.delete(errorHash);
        }
      } else {
        // Mark as shown even without RAG
        this.shownErrors.add(errorHash);
        this.processingErrors.delete(errorHash);
        // Python unavailable - show helpful message
        const yellow = '\x1b[33m';
        const reset = '\x1b[0m';
        console.log(
          `\n${yellow}[react-error-assistant] Error detected: ${parsedError.type} - ${parsedError.message}${reset}`
        );
        if (parsedError.file) {
          console.log(`${yellow}   File: ${parsedError.file}${parsedError.line ? `:${parsedError.line}` : ''}${reset}`);
        }
        console.log(
          `${yellow}[react-error-assistant] Install Python 3.11+ and run: py -3.11 -m pip install -r python/requirements.txt${reset}\n`
        );
      }
    } catch (parseErr) {
      // Don't crash on parsing errors
      console.warn(
        '[react-error-assistant] Failed to parse error:',
        parseErr instanceof Error ? parseErr.message : String(parseErr)
      );
    }
  }
}

