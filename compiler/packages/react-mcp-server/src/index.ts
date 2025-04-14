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
import {liteClient, type SearchResponse} from 'algoliasearch/lite';
import {DocSearchHit} from './types/algolia';
import {printHierarchy} from './utils/algolia';

// https://github.com/reactjs/react.dev/blob/55986965fbf69c2584040039c9586a01bd54eba7/src/siteConfig.js#L15-L19
const ALGOLIA_CONFIG = {
  appId: '1FCF9AYYAT',
  apiKey: '1b7ad4e1c89e645e351e59d40544eda1',
  indexName: 'beta-react',
};

const client = liteClient(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.apiKey);

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
    const {results} = await client.search<DocSearchHit>({
      requests: [
        {
          query: Array.isArray(message) ? message.join('\n') : message,
          indexName: ALGOLIA_CONFIG.indexName,
          attributesToRetrieve: [
            'hierarchy.lvl0',
            'hierarchy.lvl1',
            'hierarchy.lvl2',
            'hierarchy.lvl3',
            'hierarchy.lvl4',
            'hierarchy.lvl5',
            'hierarchy.lvl6',
            'content',
            'url',
          ],
          attributesToSnippet: [
            `hierarchy.lvl1:10`,
            `hierarchy.lvl2:10`,
            `hierarchy.lvl3:10`,
            `hierarchy.lvl4:10`,
            `hierarchy.lvl5:10`,
            `hierarchy.lvl6:10`,
            `content:10`,
          ],
          snippetEllipsisText: '…',
          hitsPerPage: 30,
          attributesToHighlight: [
            'hierarchy.lvl0',
            'hierarchy.lvl1',
            'hierarchy.lvl2',
            'hierarchy.lvl3',
            'hierarchy.lvl4',
            'hierarchy.lvl5',
            'hierarchy.lvl6',
            'content',
          ],
        },
      ],
    });
    const firstResult = results[0] as SearchResponse<DocSearchHit>;
    const {hits} = firstResult;
    return {
      contents: hits.map(hit => {
        return {
          uri: uri.href,
          text: hit.url,
        };
      }),
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
You are a React assistant that helps users write better React, following the rules of React in the react.dev docs.

## Available Resources
  - 'docs': Look up documentation from React.dev. Returns urls that you must retrieve so you can view its content.

## Available Tools
  - 'optimize': Run the users code through React Compiler

## Process
1. Check if the users code follows the rules of React
  - Point out issues in the users code if it does not

2. Run the compiler on the users code and see if it can successfully optimize the code
  - If the same code is returned by the compiler, it has bailed out or there is nothing to optimize

3. Iterate
  - Guide the user on making adjustments to their code so that it can be successfully optimized.
  - If it was already successfully optimized, check how many items were cached previously and compare them to each new attempt. For example, you can refer to the cache size const $ = _c(n); as a rough heuristic, where n is the size of the cache as an integer. Higher is better.

## Special Instructions
Make sure to use information from react.dev as the main reference for your React knowledge. Information from unofficial sources such as blogs and articles can also be used but may sometimes be outdated or contain poor advice.

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
