/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {compile, type PrintedCompilerPipelineValue} from './compiler';
import {
  CompilerPipelineValue,
  printReactiveFunctionWithOutlined,
  printFunctionWithOutlined,
  PluginOptions,
  SourceLocation,
} from 'babel-plugin-react-compiler/src';
import * as cheerio from 'cheerio';
import {queryAlgolia} from './utils/algolia';
import assertExhaustive from './utils/assertExhaustive';
import {convert} from 'html-to-text';
import {measurePerformance} from './utils/runtimePerf';

const server = new McpServer({
  name: 'React',
  version: '0.0.0',
});

server.tool(
  'query-react-dev-docs',
  'Search/look up official docs from react.dev',
  {
    query: z.string(),
  },
  async ({query}) => {
    try {
      const pages = await queryAlgolia(query);
      if (pages.length === 0) {
        return {
          content: [{type: 'text' as const, text: `No results`}],
        };
      }
      const content = pages.map(html => {
        const $ = cheerio.load(html);
        // react.dev should always have at least one <article> with the main content
        const article = $('article').html();
        if (article != null) {
          return {
            type: 'text' as const,
            text: convert(article),
          };
        } else {
          return {
            type: 'text' as const,
            // Fallback to converting the whole page to text.
            text: convert($.html()),
          };
        }
      });
      return {
        content,
      };
    } catch (err) {
      return {
        isError: true,
        content: [{type: 'text' as const, text: `Error: ${err.stack}`}],
      };
    }
  },
);

server.tool(
  'compile',
  'Compile code with React Compiler. Optionally, for debugging provide a pass name like "HIR" to see more information.',
  {
    text: z.string(),
    passName: z.enum(['HIR', 'ReactiveFunction', 'All', '@DEBUG']).optional(),
  },
  async ({text, passName}) => {
    const pipelinePasses = new Map<
      string,
      Array<PrintedCompilerPipelineValue>
    >();
    const recordPass: (
      result: PrintedCompilerPipelineValue,
    ) => void = result => {
      const entry = pipelinePasses.get(result.name);
      if (Array.isArray(entry)) {
        entry.push(result);
      } else {
        pipelinePasses.set(result.name, [result]);
      }
    };
    const logIR = (result: CompilerPipelineValue): void => {
      switch (result.kind) {
        case 'ast': {
          break;
        }
        case 'hir': {
          recordPass({
            kind: 'hir',
            fnName: result.value.id,
            name: result.name,
            value: printFunctionWithOutlined(result.value),
          });
          break;
        }
        case 'reactive': {
          recordPass({
            kind: 'reactive',
            fnName: result.value.id,
            name: result.name,
            value: printReactiveFunctionWithOutlined(result.value),
          });
          break;
        }
        case 'debug': {
          recordPass({
            kind: 'debug',
            fnName: null,
            name: result.name,
            value: result.value,
          });
          break;
        }
        default: {
          assertExhaustive(result, `Unhandled result ${result}`);
        }
      }
    };
    const errors: Array<{message: string; loc: SourceLocation | null}> = [];
    const compilerOptions: Partial<PluginOptions> = {
      panicThreshold: 'none',
      logger: {
        debugLogIRs: logIR,
        logEvent: (_filename, event): void => {
          if (event.kind === 'CompileError') {
            const detail = event.detail;
            const loc =
              detail.loc == null || typeof detail.loc == 'symbol'
                ? event.fnLoc
                : detail.loc;
            errors.push({
              message: detail.reason,
              loc,
            });
          }
        },
      },
    };
    try {
      const result = await compile({
        text,
        file: 'anonymous.tsx',
        options: compilerOptions,
      });
      if (result.code == null) {
        return {
          isError: true,
          content: [{type: 'text' as const, text: 'Error: Could not compile'}],
        };
      }
      const requestedPasses: Array<{type: 'text'; text: string}> = [];
      if (passName != null) {
        switch (passName) {
          case 'All': {
            const hir = pipelinePasses.get('PropagateScopeDependenciesHIR');
            if (hir !== undefined) {
              for (const pipelineValue of hir) {
                requestedPasses.push({
                  type: 'text' as const,
                  text: pipelineValue.value,
                });
              }
            }
            const reactiveFunc = pipelinePasses.get('PruneHoistedContexts');
            if (reactiveFunc !== undefined) {
              for (const pipelineValue of reactiveFunc) {
                requestedPasses.push({
                  type: 'text' as const,
                  text: pipelineValue.value,
                });
              }
            }
            break;
          }
          case 'HIR': {
            // Last pass before HIR -> ReactiveFunction
            const requestedPass = pipelinePasses.get(
              'PropagateScopeDependenciesHIR',
            );
            if (requestedPass !== undefined) {
              for (const pipelineValue of requestedPass) {
                requestedPasses.push({
                  type: 'text' as const,
                  text: pipelineValue.value,
                });
              }
            } else {
              console.error(`Could not find requested pass ${passName}`);
            }
            break;
          }
          case 'ReactiveFunction': {
            // Last pass
            const requestedPass = pipelinePasses.get('PruneHoistedContexts');
            if (requestedPass !== undefined) {
              for (const pipelineValue of requestedPass) {
                requestedPasses.push({
                  type: 'text' as const,
                  text: pipelineValue.value,
                });
              }
            } else {
              console.error(`Could not find requested pass ${passName}`);
            }
            break;
          }
          case '@DEBUG': {
            for (const [, pipelinePass] of pipelinePasses) {
              for (const pass of pipelinePass) {
                requestedPasses.push({
                  type: 'text' as const,
                  text: `${pass.name}\n\n${pass.value}`,
                });
              }
            }
            break;
          }
          default: {
            assertExhaustive(
              passName,
              `Unhandled passName option: ${passName}`,
            );
          }
        }
        const requestedPass = pipelinePasses.get(passName);
        if (requestedPass !== undefined) {
          for (const pipelineValue of requestedPass) {
            if (pipelineValue.name === passName) {
              requestedPasses.push({
                type: 'text' as const,
                text: pipelineValue.value,
              });
            }
          }
        }
      }
      if (errors.length > 0) {
        return {
          content: errors.map(err => {
            return {
              type: 'text' as const,
              text:
                err.loc === null || typeof err.loc === 'symbol'
                  ? `React Compiler bailed out:\n\n${err.message}`
                  : `React Compiler bailed out:\n\n${err.message}@${err.loc.start.line}:${err.loc.end.line}`,
            };
          }),
        };
      }
      return {
        content: [
          {type: 'text' as const, text: result.code},
          ...requestedPasses,
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{type: 'text' as const, text: `Error: ${err.stack}`}],
      };
    }
  },
);

server.prompt('review-react-code', () => ({
  messages: [
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `
## Role
You are a React assistant that helps users write more efficient and optimizable React code. You specialize in identifying patterns that enable React Compiler to automatically apply optimizations, reducing unnecessary re-renders and improving application performance.

## Follow these guidelines in all code you produce and suggest
Use functional components with Hooks: Do not generate class components or use old lifecycle methods. Manage state with useState or useReducer, and side effects with useEffect (or related Hooks). Always prefer functions and Hooks for any new component logic.

Keep components pure and side-effect-free during rendering: Do not produce code that performs side effects (like subscriptions, network requests, or modifying external variables) directly inside the component's function body. Such actions should be wrapped in useEffect or performed in event handlers. Ensure your render logic is a pure function of props and state.

Respect one-way data flow: Pass data down through props and avoid any global mutations. If two components need to share data, lift that state up to a common parent or use React Context, rather than trying to sync local state or use external variables.

Never mutate state directly: Always generate code that updates state immutably. For example, use spread syntax or other methods to create new objects/arrays when updating state. Do not use assignments like state.someValue = ... or array mutations like array.push() on state variables. Use the state setter (setState from useState, etc.) to update state.

Accurately use useEffect and other effect Hooks: whenever you think you could useEffect, think and reason harder to avoid it. useEffect is primarily only used for synchronization, for example synchronizing React with some external state. IMPORTANT - Don't setState (the 2nd value returned by useState) within a useEffect as that will degrade performance. When writing effects, include all necessary dependencies in the dependency array. Do not suppress ESLint rules or omit dependencies that the effect's code uses. Structure the effect callbacks to handle changing values properly (e.g., update subscriptions on prop changes, clean up on unmount or dependency change). If a piece of logic should only run in response to a user action (like a form submission or button click), put that logic in an event handler, not in a useEffect. Where possible, useEffects should return a cleanup function.

Follow the Rules of Hooks: Ensure that any Hooks (useState, useEffect, useContext, custom Hooks, etc.) are called unconditionally at the top level of React function components or other Hooks. Do not generate code that calls Hooks inside loops, conditional statements, or nested helper functions. Do not call Hooks in non-component functions or outside the React component rendering context.

Use refs only when necessary: Avoid using useRef unless the task genuinely requires it (such as focusing a control, managing an animation, or integrating with a non-React library). Do not use refs to store application state that should be reactive. If you do use refs, never write to or read from ref.current during the rendering of a component (except for initial setup like lazy initialization). Any ref usage should not affect the rendered output directly.

Prefer composition and small components: Break down UI into small, reusable components rather than writing large monolithic components. The code you generate should promote clarity and reusability by composing components together. Similarly, abstract repetitive logic into custom Hooks when appropriate to avoid duplicating code.

Optimize for concurrency: Assume React may render your components multiple times for scheduling purposes (especially in development with Strict Mode). Write code that remains correct even if the component function runs more than once. For instance, avoid side effects in the component body and use functional state updates (e.g., setCount(c => c + 1)) when updating state based on previous state to prevent race conditions. Always include cleanup functions in effects that subscribe to external resources. Don't write useEffects for "do this when this changes" side-effects. This ensures your generated code will work with React's concurrent rendering features without issues.

Optimize to reduce network waterfalls - Use parallel data fetching wherever possible (e.g., start multiple requests at once rather than one after another). Leverage Suspense for data loading and keep requests co-located with the component that needs the data. In a server-centric approach, fetch related data together in a single request on the server side (using Server Components, for example) to reduce round trips. Also, consider using caching layers or global fetch management to avoid repeating identical requests.

Rely on React Compiler - useMemo, useCallback, and React.memo can be omitted if React Compiler is enabled. Avoid premature optimization with manual memoization. Instead, focus on writing clear, simple components with direct data flow and side-effect-free render functions. Let the React Compiler handle tree-shaking, inlining, and other performance enhancements to keep your code base simpler and more maintainable.

Design for a good user experience - Provide clear, minimal, and non-blocking UI states. When data is loading, show lightweight placeholders (e.g., skeleton screens) rather than intrusive spinners everywhere. Handle errors gracefully with a dedicated error boundary or a friendly inline message. Where possible, render partial data as it becomes available rather than making the user wait for everything. Suspense allows you to declare the loading states in your component tree in a natural way, preventing “flash” states and improving perceived performance.

Server Components - Shift data-heavy logic to the server whenever possible. Break up the more static parts of the app into server components. Break up data fetching into server components. Only client components (denoted by the 'use client' top level directive) need interactivity. By rendering parts of your UI on the server, you reduce the client-side JavaScript needed and avoid sending unnecessary data over the wire. Use Server Components to prefetch and pre-render data, allowing faster initial loads and smaller bundle sizes. This also helps manage or eliminate certain waterfalls by resolving data on the server before streaming the HTML (and partial React tree) to the client.

## Available Tools
- 'docs': Look up documentation from react.dev. Returns text as a string.
- 'compile': Run the user's code through React Compiler. Returns optimized JS/TS code with potential diagnostics.

## Process
1. Analyze the user's code for optimization opportunities:
   - Check for React anti-patterns that prevent compiler optimization
   - Identify unnecessary manual optimizations (useMemo, useCallback, React.memo) that the compiler can handle
   - Look for component structure issues that limit compiler effectiveness
   - Think about each suggestion you are making and consult React docs using the docs://{query} resource for best practices

2. Use React Compiler to verify optimization potential:
   - Run the code through the compiler and analyze the output
   - You can run the compiler multiple times to verify your work
   - Check for successful optimization by looking for const $ = _c(n) cache entries, where n is an integer
   - Identify bailout messages that indicate where code could be improved
   - Compare before/after optimization potential

3. Provide actionable guidance:
   - Explain specific code changes with clear reasoning
   - Show before/after examples when suggesting changes
   - Include compiler results to demonstrate the impact of optimizations
   - Only suggest changes that meaningfully improve optimization potential

## Optimization Guidelines
- Avoid mutation of values that are memoized by the compiler
- State updates should be structured to enable granular updates
- Side effects should be isolated and dependencies clearly defined
- The compiler automatically inserts memoization, so manually added useMemo/useCallback/React.memo can often be removed

## Understanding Compiler Output
- Successful optimization adds import { c as _c } from "react/compiler-runtime";
- Successful optimization initializes a constant sized cache with const $ = _c(n), where n is the size of the cache as an integer
- When suggesting changes, try to increase or decrease the number of cached expressions (visible in const $ = _c(n))
  - Increase: more memoization coverage
  - Decrease: if there are unnecessary dependencies, less dependencies mean less re-rendering
`,
      },
    },
  ],
}));

server.tool(
  'review-react-runtime',
  'Review the runtime of the code and get performance data to evaluate the proposed solution',
  {
    text: z.string(),
  },
  async ({text}) => {
    try {
      const iterations = 5;

      let perfData = {
        renderTime: 0,
        webVitals: {
          cls: 0,
          lcp: 0,
          inp: 0,
          fid: 0,
          ttfb: 0,
        },
        reactProfilerMetrics: {
          id: 0,
          phase: 0,
          actualDuration: 0,
          baseDuration: 0,
          startTime: 0,
          commitTime: 0,
        },
        error: null,
      };

      for (let i = 0; i < iterations; i++) {
        const performanceResults = await measurePerformance(text);
        perfData.renderTime += performanceResults.renderTime;
        perfData.webVitals.cls += performanceResults.webVitals.cls?.value || 0;
        perfData.webVitals.lcp += performanceResults.webVitals.lcp?.value || 0;
        perfData.webVitals.inp += performanceResults.webVitals.inp?.value || 0;
        perfData.webVitals.fid += performanceResults.webVitals.fid?.value || 0;
        perfData.webVitals.ttfb +=
          performanceResults.webVitals.ttfb?.value || 0;

        perfData.reactProfilerMetrics.id +=
          performanceResults.reactProfilerMetrics.actualDuration?.value || 0;
        perfData.reactProfilerMetrics.phase +=
          performanceResults.reactProfilerMetrics.phase?.value || 0;
        perfData.reactProfilerMetrics.actualDuration +=
          performanceResults.reactProfilerMetrics.actualDuration?.value || 0;
        perfData.reactProfilerMetrics.baseDuration +=
          performanceResults.reactProfilerMetrics.baseDuration?.value || 0;
        perfData.reactProfilerMetrics.startTime +=
          performanceResults.reactProfilerMetrics.startTime?.value || 0;
        perfData.reactProfilerMetrics.commitTime +=
          performanceResults.reactProfilerMetrics.commitTim?.value || 0;
      }

      const formattedResults = `
# React Component Performance Results

## Mean Render Time
${perfData.renderTime / iterations}ms

## Mean Web Vitals
- Cumulative Layout Shift (CLS): ${perfData.webVitals.cls / iterations}
- Largest Contentful Paint (LCP): ${perfData.webVitals.lcp / iterations}ms
- Interaction to Next Paint (INP): ${perfData.webVitals.inp / iterations}ms
- First Input Delay (FID): ${perfData.webVitals.fid / iterations}ms
- Time to First Byte (TTFB): ${perfData.webVitals.ttfb / iterations}ms

## Mean React Profiler
- Actual Duration: ${perfData.reactProfilerMetrics.actualDuration / iterations}ms
- Base Duration: ${perfData.reactProfilerMetrics.baseDuration / iterations}ms
- Start Time: ${perfData.reactProfilerMetrics.startTime / iterations}ms
- Commit Time: ${perfData.reactProfilerMetrics.commitTime / iterations}ms

These metrics can help you evaluate the performance of your React component. Lower values generally indicate better performance.
`;

      return {
        content: [
          {
            type: 'text' as const,
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error measuring performance: ${error.message}\n\n${error.stack}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('React Compiler MCP Server running on stdio');
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
