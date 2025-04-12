/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {compile} from './compiler';
import {
  CompilerPipelineValue,
  printReactiveFunctionWithOutlined,
  printFunctionWithOutlined,
} from 'babel-plugin-react-compiler/src';
import {type CallToolResult} from '@modelcontextprotocol/sdk/types.js';

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
  name: 'React Compiler',
  version: '0.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  'analyze',
  'Use React Compiler to analyze React code',
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
        content: [{type: 'text', text: `Error: ${err}`}],
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
