/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Configuration options for the error assistant plugin
 */
export interface ErrorAssistantOptions {
  /**
   * Enable or disable the error assistant
   * @default true
   */
  enabled?: boolean;

  /**
   * Path to user configuration file
   * @default '~/.react-error-assistant/config.json'
   */
  configPath?: string;

  /**
   * Port for Python HTTP server (auto-detected if not specified)
   * @default undefined (auto-detect, starts at 8080)
   */
  pythonServerPort?: number;

  /**
   * Path to knowledge base directory
   * @default '~/.react-error-assistant/knowledge-base/'
   */
  knowledgeBasePath?: string;
}

/**
 * Parsed error information
 */
export interface ParsedError {
  type: ErrorType;
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  component?: string;
}

/**
 * Error types that can be detected
 */
export type ErrorType =
  | 'MODULE_NOT_FOUND'
  | 'MODULE_RESOLUTION_ERROR'
  | 'TRANSFORM_ERROR'
  | 'TYPE_ERROR'
  | 'SYNTAX_ERROR'
  | 'HMR_ERROR'
  | 'UNKNOWN';

/**
 * Solution response from RAG pipeline
 */
export interface Solution {
  explanation: string;
  cause?: string;
  steps?: string[];
  codeExamples?: CodeExample[];
  documentationLinks?: string[];
  confidenceScore?: number;
}

/**
 * Code example in solution
 */
export interface CodeExample {
  language: string;
  code: string;
  description?: string;
}

