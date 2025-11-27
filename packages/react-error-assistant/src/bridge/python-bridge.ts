/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios, { type AxiosInstance } from 'axios';
import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { ParsedError, Solution } from '../types';
import type { ErrorContext } from '../error/context-extractor';

export interface PythonBridgeOptions {
  port?: number;
  knowledgeBasePath?: string;
}

/**
 * Bridge for communication with Python RAG pipeline server
 */
export class PythonBridge {
  private serverProcess: ChildProcess | null = null;
  private axiosInstance: AxiosInstance | null = null;
  private port: number;
  private knowledgeBasePath: string;
  private serverUrl: string;
  private isRunning: boolean = false;

  constructor(options: PythonBridgeOptions = {}) {
    this.port = options.port || 8080;
    this.knowledgeBasePath =
      options.knowledgeBasePath ||
      path.join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.react-error-assistant', 'knowledge-base');
    this.serverUrl = `http://localhost:${this.port}`;
  }

  /**
   * Start Python HTTP server
   */
  async startServer(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    // Check if Python 3.11 is available (required for ChromaDB compatibility)
    const pythonAvailable = await this.checkPython311Available();
    if (!pythonAvailable) {
      throw new Error('Python 3.11+ is required but not found. Install Python 3.11 or use: py -3.11');
    }

    // Find available port
    this.port = await this.findAvailablePort(this.port);

    // Start Python server
    const serverPath = path.join(__dirname, '../../python/server.py');
    
    // Check if server file exists
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Python server not found at ${serverPath}`);
    }

    // Use Python 3.11 (Windows: py -3.11, Unix: python3.11)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python3.11';
    const pythonArgs = process.platform === 'win32' ? ['-3.11', serverPath, '--port', String(this.port)] : [serverPath, '--port', String(this.port)];

    this.serverProcess = spawn(pythonCmd, pythonArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        KNOWLEDGE_BASE_PATH: this.knowledgeBasePath,
      },
    });

    // Wait for server to be ready
    await this.waitForServer();

    this.axiosInstance = axios.create({
      baseURL: this.serverUrl,
      timeout: 60000, // 60s timeout (increased for RAG processing)
    });

    this.isRunning = true;
  }

  /**
   * Stop Python server
   */
  async stopServer(): Promise<void> {
    if (!this.serverProcess) {
      return;
    }

    this.isRunning = false;

    return new Promise((resolve) => {
      if (this.serverProcess) {
        this.serverProcess.once('exit', () => {
          this.serverProcess = null;
          this.axiosInstance = null;
          resolve();
        });
        this.serverProcess.kill();
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning && this.axiosInstance !== null;
  }

  /**
   * Analyze error using RAG pipeline
   */
  async analyzeError(
    parsedError: ParsedError,
    context: ErrorContext
  ): Promise<Solution | null> {
    if (!this.axiosInstance) {
      throw new Error('Python server is not running');
    }

    try {
      const response = await this.axiosInstance.post<{ solution: Solution }>(
        '/api/analyze',
        {
          error: parsedError,
          context,
        }
      );

      return response.data.solution;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `RAG pipeline error: ${error.message}${error.response ? ` (${error.response.status})` : ''}`
        );
      }
      throw error;
    }
  }

  /**
   * Check if Python 3.11+ is available
   */
  private async checkPython311Available(): Promise<boolean> {
    return new Promise((resolve) => {
      // Windows: try py launcher first
      if (process.platform === 'win32') {
        const py = spawn('py', ['-3.11', '--version']);
        py.on('error', () => {
          // Fallback to python3.11
          const python311 = spawn('python3.11', ['--version']);
          python311.on('error', () => resolve(false));
          python311.on('close', (code) => resolve(code === 0));
        });
        py.on('close', (code) => resolve(code === 0));
      } else {
        // Unix: try python3.11
        const python311 = spawn('python3.11', ['--version']);
        python311.on('error', () => {
          // Fallback to python3
          const python3 = spawn('python3', ['--version']);
          python3.on('error', () => resolve(false));
          python3.on('close', (code) => {
            // Check version is 3.11+
            if (code === 0) {
              // Version check would require parsing output, simplified for now
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });
        python311.on('close', (code) => resolve(code === 0));
      }
    });
  }

  /**
   * Find available port starting from given port
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    // Simple port check - try to connect
    // In production, use a proper port scanner
    return startPort; // Simplified for now
  }

  /**
   * Wait for server to be ready (health check)
   */
  private async waitForServer(maxRetries = 30, delay = 1000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${this.serverUrl}/health`, {
          timeout: 1000,
        });
        if (response.data.status === 'ok') {
          return;
        }
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error('Python server failed to start within timeout');
  }
}

