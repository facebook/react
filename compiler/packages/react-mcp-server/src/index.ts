/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
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
import TurndownService from 'turndown';
import {queryAlgolia} from './utils/algolia';
import assertExhaustive from './utils/assertExhaustive';

const turndownService = new TurndownService();
const server = new McpServer({
  name: 'React',
  version: '0.0.0',
});

function slugify(heading: string): string {
  return heading
    .split(' ')
    .map(w => w.toLowerCase())
    .join('-');
}

// TODO: how to verify this works?
server.resource(
  'docs',
  new ResourceTemplate('docs://{message}', {list: undefined}),
  async (_uri, {message}) => {
    const hits = await queryAlgolia(message);
    const deduped = new Map();
    for (const hit of hits) {
      // drop hashes to dedupe properly
      const u = new URL(hit.url);
      if (deduped.has(u.pathname)) {
        continue;
      }
      deduped.set(u.pathname, hit);
    }
    const pages: Array<string | null> = await Promise.all(
      Array.from(deduped.values()).map(hit => {
        return fetch(hit.url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          },
        }).then(res => {
          if (res.ok === true) {
            return res.text();
          } else {
            console.error(
              `Could not fetch docs: ${res.status} ${res.statusText}`,
            );
            return null;
          }
        });
      }),
    );

    const resultsMarkdown = pages
      .filter(html => html !== null)
      .map(html => {
        const $ = cheerio.load(html);
        const title = encodeURIComponent(slugify($('h1').text()));
        // react.dev should always have at least one <article> with the main content
        const article = $('article').html();
        if (article != null) {
          return {
            uri: `docs://${title}`,
            text: turndownService.turndown(article),
          };
        } else {
          return {
            uri: `docs://${title}`,
            // Fallback to converting the whole page to markdown
            text: turndownService.turndown($.html()),
          };
        }
      });

    return {
      contents: resultsMarkdown,
    };
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
    const errors: Array<{message: string; loc: SourceLocation}> = [];
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
            if (loc != null) {
              errors.push({
                message: detail.reason,
                loc,
              });
            }
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
        const errMessages = errors.map(err => {
          if (typeof err.loc !== 'symbol') {
            return {
              type: 'text' as const,
              text: `React Compiler bailed out:\n\n${err.message}@${err.loc.start.line}:${err.loc.end.line}`,
            };
          }
          return null;
        });
        return {
          content: errMessages.filter(msg => msg !== null),
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

server.prompt('review-code', {code: z.string()}, ({code}) => ({
  messages: [
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `# React Expert Assistant

## Role
You are a React expert assistant that helps users write more efficient and optimizable React code. You specialize in identifying patterns that enable React Compiler to automatically apply optimizations, reducing unnecessary re-renders and improving application performance. Only suggest changes that are strictly necessary, and take all care to not change the semantics of the original code or I will charge you 1 billion dollars.

## Available Resources
- 'docs': Look up documentation from React.dev. Returns markdown as a string.

## Available Tools
- 'compile': Run the user's code through React Compiler. Returns optimized JS/TS code with potential diagnostics.

## Process
1. Analyze the user's code for optimization opportunities:
   - Check for React anti-patterns that prevent compiler optimization
   - Identify unnecessary manual optimizations (useMemo, useCallback, React.memo) that the compiler can handle
   - Look for component structure issues that limit compiler effectiveness
   - Consult React.dev docs using the 'docs' resource when necessary

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

As an example:

\`\`\`
export default function MyApp() {
  return <div>Hello World</div>;
}
\`\`\`

Results in:

\`\`\`
import { c as _c } from "react/compiler-runtime";
export default function MyApp() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>Hello World</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
\`\`\`

The code above was memoized successfully by the compiler as you can see from the injected import { c as _c } from "react/compiler-runtime"; statement. The cache size is initialized at 1 slot. This code has been memoized with one MemoBlock, represented by the if/else statement. Because the MemoBlock has no dependencies, the cached value is compared to a sentinel Symbol.for("react.memo_cache_sentinel") value once and then cached forever.

Here's an example of code that results in a MemoBlock with one dependency, as you can see by the comparison against the name prop:

\`\`\`js
export default function MyApp({name}) {
  return <div>Hello World, {name}</div>;
}
\`\`\`

\`\`\`js
import { c as _c } from "react/compiler-runtime";
export default function MyApp(t0) {
  const $ = _c(2);
  const { name } = t0;
  let t1;
  if ($[0] !== name) {
    t1 = <div>Hello World, {name}</div>;
    $[0] = name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
\`\`\`

## Example 1: <todo>

## Example 2: <todo>

Review the following code:

${code}
`,
      },
    },
  ],
}));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('React Compiler MCP Server running on stdio');
}

main().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
