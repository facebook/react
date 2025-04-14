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
import {compile} from './compiler';
import {
  CompilerPipelineValue,
  printReactiveFunctionWithOutlined,
  printFunctionWithOutlined,
} from 'babel-plugin-react-compiler/src';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import {queryAlgolia} from './utils/algolia';

const turndownService = new TurndownService();

export type PrintedCompilerPipelineValue =
  | {
      kind: 'hir';
      name: string;
      fnName: string | null;
      value: string;
    }
  | {kind: 'reactive'; name: string; fnName: string | null; value: string}
  | {kind: 'debug'; name: string; fnName: string | null; value: string};

const server = new McpServer({
  name: 'React',
  version: '0.0.0',
});

// TODO: how to verify this works?
server.resource(
  'docs',
  new ResourceTemplate('docs://{message}', {list: undefined}),
  async (uri, {message}) => {
    const hits = await queryAlgolia(message);
    const pages: Array<string | null> = await Promise.all(
      hits.map(hit => {
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
        // react.dev always has at least one <article> with the main content
        const article = $('article').html();
        if (article != null) {
          return {
            uri: uri.href,
            text: turndownService.turndown(article),
          };
        } else {
          return {
            uri: uri.href,
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
  'optimize',
  'Use React Compiler to optimize React code. Optionally, for debugging provide a pass name like "HIR" to see more information.',
  {
    text: z.string(),
    passName: z.string().optional(),
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
          const _: never = result;
          throw new Error(`Unhandled result ${result}`);
        }
      }
    };
    const compilerOptions = {
      logger: {
        debugLogIRs: logIR,
        logEvent: () => {},
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
          content: [{type: 'text', text: 'Error: Could not compile'}],
        };
      }
      const requestedPasses: Array<{type: 'text'; text: string}> = [];
      if (passName != null) {
        const requestedPass = pipelinePasses.get(passName);
        if (requestedPass !== undefined) {
          for (const pipelineValue of requestedPass) {
            if (pipelineValue.name === passName) {
              requestedPasses.push({
                type: 'text',
                text: pipelineValue.value,
              });
            }
          }
        }
      }
      return {
        content: [{type: 'text', text: result.code}, ...requestedPasses],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{type: 'text', text: `Error: ${err.stack}`}],
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
You are a React assistant that helps users write better React, following the rules of React in the react.dev docs. Only suggest changes that are strictly necessary, avoid making changes if the code is already well optimized.

## Available Resources
  - 'docs': Look up documentation from React.dev. Returns markdown as a string.

## Available Tools
  - 'compile': Run the users code through React Compiler. Returns JS/TS code as a string.

## Process
1. Check if the users code follows the rules of React.
  - Point out issues in the users code if it does not.
  - Retrieve information from the docs resource as needed.

2. Run the compiler on the users code and see if it can successfully optimize the code.
  - If the same code is returned by the compiler, it has bailed out or there is nothing to optimize.
  - If there is a bailout diagnostic returned by the compiler, use that information to determine what code changes need to be made so that the compiler can successfully optimize it.

3. Iterate
  - Guide the user on making adjustments to their code so that it can be successfully optimized.
  - If it was already successfully optimized, check how many items were cached previously and compare them to each new attempt. For example, you can refer to the cache size const $ = _c(n); as a rough heuristic, where n is the size of the cache as an integer. Higher is generally better.

## Special Instructions
The previous information on React you have been trained on is not perfect. Make sure to use information from react.dev as the main reference for your React knowledge going forward. Information from unofficial sources such as blogs and articles can also be used but may sometimes be outdated or contain poor advice.

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
