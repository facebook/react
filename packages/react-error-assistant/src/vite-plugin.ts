/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Vite types - using any for now since vite is peer dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plugin = any;
import type { ErrorAssistantOptions } from './types';
import { PythonBridge } from './bridge/python-bridge';
import { ErrorInterceptor } from './error/interceptor';

/**
 * Vite plugin for React Error Assistant
 * 
 * @param options - Configuration options
 * @returns Vite plugin instance
 */
export function errorAssistant(
  options: ErrorAssistantOptions = {}
): Plugin {
  const {
    enabled = true,
    pythonServerPort,
    knowledgeBasePath,
  } = options;

  let pythonBridge: PythonBridge | null = null;
  let errorInterceptor: ErrorInterceptor | null = null;

  // Initialize error interceptor early (before configureServer)
  if (enabled) {
    try {
      const bridgeOptions: { port?: number; knowledgeBasePath?: string } = {};
      if (pythonServerPort !== undefined) bridgeOptions.port = pythonServerPort;
      if (knowledgeBasePath !== undefined) bridgeOptions.knowledgeBasePath = knowledgeBasePath;
      pythonBridge = new PythonBridge(bridgeOptions);
      errorInterceptor = new ErrorInterceptor(pythonBridge);
    } catch (error) {
      console.warn(
        '[react-error-assistant] Failed to initialize. Error parsing will still work.',
        error
      );
    }
  }

  return {
    name: 'error-assistant',
    enforce: 'post',

    async buildStart() {
      if (!enabled) {
        return;
      }

      try {
        // Start Python server (non-blocking, will degrade gracefully)
        if (pythonBridge) {
          await pythonBridge.startServer().catch((error) => {
            console.warn(
              '[react-error-assistant] Python server unavailable. RAG features disabled.',
              error.message
            );
          });
        }
      } catch (error) {
        console.warn(
          '[react-error-assistant] Failed to start Python server.',
          error
        );
      }

      // Also intercept errors during build (build mode doesn't use configureServer)
      if (errorInterceptor) {
        const originalError = console.error;
        const originalWarn = console.warn;
        const errorPattern = /Failed to resolve import|Cannot find module|Module not found|failed to resolve|could not be resolved|dependencies are imported but could not be resolved|Unexpected token|SyntaxError|Parse error|Transform failed|transformation error|Unterminated|Failed to scan|Property.*does not exist on type|Type.*is not assignable|Type error|Could not resolve|error during build|Build failed|ERROR/i;
        
        console.error = function(...args: any[]) {
          const errorMessage = args.join(' ');
          if (errorPattern.test(errorMessage)) {
            const error = new Error(errorMessage);
            if (args[0]?.stack) {
              error.stack = args[0].stack;
            }
            setTimeout(() => {
              errorInterceptor!.handleError(error).catch(() => {});
            }, 100);
          }
          originalError.apply(console, args);
        };

        console.warn = function(...args: any[]) {
          const errorMessage = args.join(' ');
          if (errorPattern.test(errorMessage)) {
            const error = new Error(errorMessage);
            if (args[0]?.stack) {
              error.stack = args[0].stack;
            }
            setTimeout(() => {
              errorInterceptor!.handleError(error).catch(() => {});
            }, 100);
          }
          originalWarn.apply(console, args);
        };
      }
    },

    configureServer(_server: any) {
      if (!enabled || !errorInterceptor) {
        return;
      }

      // Hook into Vite's error logging to intercept errors
      // This catches errors that are logged to the console
      const originalError = console.error;
      const originalWarn = console.warn;
      // Catch all common React/Vite errors (including TypeScript type errors)
      const errorPattern = /Failed to resolve import|Cannot find module|Module not found|failed to resolve|could not be resolved|dependencies are imported but could not be resolved|Unexpected token|SyntaxError|Parse error|Transform failed|transformation error|Unterminated|Failed to scan|Property.*does not exist on type|Type.*is not assignable|Type error|ERROR/i;
      
      console.error = function(...args: any[]) {
        const errorMessage = args.join(' ');
        if (errorPattern.test(errorMessage)) {
          // Create an error object from the console output
          const error = new Error(errorMessage);
          if (args[0]?.stack) {
            error.stack = args[0].stack;
          }
          // Process error asynchronously (don't block console output)
          setTimeout(() => {
            errorInterceptor!.handleError(error).catch(() => {});
          }, 100);
        }
        // Call original console.error
        originalError.apply(console, args);
      };

      // Also catch warnings that might be errors
      console.warn = function(...args: any[]) {
        const errorMessage = args.join(' ');
        if (errorPattern.test(errorMessage)) {
          const error = new Error(errorMessage);
          if (args[0]?.stack) {
            error.stack = args[0].stack;
          }
          setTimeout(() => {
            errorInterceptor!.handleError(error).catch(() => {});
          }, 100);
        }
        originalWarn.apply(console, args);
      };

      // Note: We don't intercept middleware errors here because:
      // 1. They create generic "HTTP 500" messages without useful context
      // 2. The actual errors are already caught by console.error with full details
      // 3. Intercepting both causes duplicate processing
    },

    // Intercept module resolution errors
    resolveId(_id: any, _importer: any) {
      if (!enabled || !errorInterceptor) {
        return null;
      }
      // Return null to let Vite handle it normally
      // Errors will be caught in transform/load hooks
      return null;
    },

    // Intercept transform errors
    transform(_code: any, _id: any) {
      if (!enabled || !errorInterceptor) {
        return null;
      }
      
      // Try to transform and catch errors
      // Note: This hook runs before Vite's transform, so we can't catch transform errors here
      // Errors are caught via console.error hook in configureServer
      return null;
    },

    // Intercept load errors
    load(_id: any) {
      if (!enabled || !errorInterceptor) {
        return null;
      }
      // Return null to let Vite handle it normally
      return null;
    },

    buildEnd(error: any) {
      if (!enabled || !errorInterceptor) {
        return;
      }

      // Intercept build-time errors
      // Note: buildEnd is called even when build fails
      // The error might be a Rollup error object with different structure
      if (error) {
        // Convert error to Error object if it's not already
        let errorObj: Error;
        if (error instanceof Error) {
          errorObj = error;
        } else if (typeof error === 'string') {
          errorObj = new Error(error);
        } else {
          // Rollup error object - extract message
          const message = (error as any).message || String(error);
          errorObj = new Error(message);
          if ((error as any).stack) {
            errorObj.stack = (error as any).stack;
          }
          if ((error as any).id) {
            // Add file path to message if available
            errorObj.message = `${message} (file: ${(error as any).id})`;
          }
        }
        
        // Process error asynchronously to not block build
        setTimeout(() => {
          errorInterceptor.handleError(errorObj).catch((err) => {
            // Don't crash build on assistant errors
            console.warn('[react-error-assistant] Failed to process error:', err);
          });
        }, 100);
      }
      
      // Also check if error was output to console (fallback for Rollup errors)
      // Rollup errors might not be passed to buildEnd, but are logged to console
      // The console.error hook in buildStart should catch them
    },

    handleHotUpdate(ctx: any) {
      if (!enabled || !errorInterceptor) {
        return ctx.modules;
      }

      // Clear error tracking when file changes (errors might be fixed)
      // This allows new errors to be shown, and prevents showing solutions for fixed errors
      errorInterceptor.clearErrorTracking();

      // Intercept HMR errors
      const modulesWithErrors = ctx.modules.filter((m: any) => m.error);
      if (modulesWithErrors.length > 0) {
        modulesWithErrors.forEach((module: any) => {
          if (module.error) {
            errorInterceptor!.handleError(module.error).catch((err) => {
              // Don't crash HMR on assistant errors
              console.warn('[react-error-assistant] Failed to process error:', err);
            });
          }
        });
      }
      
      return ctx.modules;
    },

    async closeBundle() {
      // Cleanup: stop Python server
      if (pythonBridge) {
        await pythonBridge.stopServer().catch(() => {
          // Ignore errors during cleanup
        });
      }
    },
  };
}
