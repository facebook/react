import {
  PassNameType,
  assertExhaustive,
  compileTool,
  componentTreeTool,
  devDocsTool,
  runtimePerfTool,
} from 'react-mcp-server/src';

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

yargs()
  .scriptName('react-tools-cli')
  .usage('$0 <cmd> [args]')
  .command(
    'compile [code] [pass-name]',
    'Compile React code with React Compiler',
    yargs => {
      yargs
        .positional('code', {
          type: 'string',
          describe: 'The code to compile',
        })
        .option('pass-name', {
          type: 'string',
          choices: ['HIR', 'ReactiveFunction', 'All', '@DEBUG'],
          describe: 'Compiler pass to run',
        });
    },
    async function (argv) {
      const code: string = String(argv['code'] ?? '');
      const passName: PassNameType = argv['pass-name'] as PassNameType;

      const results = await compileTool(code, passName);

      switch (results.kind) {
        case 'success': {
          console.log(
            JSON.stringify({
              isError: false,
              content: results.content.map(text => {
                return {
                  type: 'text' as const,
                  text,
                };
              }),
            }),
          );
          break;
        }
        case 'bailout': {
          console.log(
            JSON.stringify({
              isError: true,
              content: results.content.map(text => {
                return {
                  type: 'text' as const,
                  text,
                };
              }),
            }),
          );
          break;
        }
        case 'error':
        case 'compile-error':
          console.log(
            JSON.stringify({
              isError: true,
              content: [
                {
                  type: 'text' as const,
                  text: results.text,
                },
              ],
            }),
          );
          break;
        default:
          assertExhaustive(
            results,
            `Unhandled result ${JSON.stringify(results)}`,
          );
      }
    },
  )
  .command(
    'query-docs [query]',
    'Compile React code with React Compiler',
    yargs => {
      yargs.positional('query', {
        type: 'string',
        describe: 'Browse oficcial React documentation for a given query',
      });
    },
    async function (argv) {
      const query: string = String(argv['query'] ?? '');

      const result = await devDocsTool(query);

      switch (result.kind) {
        case 'success':
          console.log(
            JSON.stringify({
              isError: false,
              content: result.content.map(text => {
                return {
                  type: 'text' as const,
                  text: text,
                };
              }),
            }),
          );
          break;
        case 'error':
          console.log(
            JSON.stringify({
              isError: true,
              content: [{type: 'text' as const, text: result.text}],
            }),
          );
          break;
        default:
          assertExhaustive(
            result,
            `Unhandled result ${JSON.stringify(result)}`,
          );
      }
    },
  )
  .command(
    'get-component-tree [url]',
    'Get the React component tree for a given URL',
    yargs => {
      yargs.positional('url', {
        type: 'string',
        default: 'https://localhost:3000',
        describe: 'URL for a React App to get the component tree for',
      });
    },
    async function (argv) {
      const url: string = String(argv['url']);
      try {
        const result = await componentTreeTool(url);

        console.log(
          JSON.stringify({
            content: [
              {
                type: 'text' as const,
                text: result,
              },
            ],
          }),
        );
      } catch (err) {
        console.log(
          JSON.stringify({
            isError: true,
            content: [{type: 'text' as const, text: `Error: ${err.stack}`}],
          }),
        );
      }
    },
  )
  .command(
    'review-code-runtime [code] [iterations',
    'Get the React component tree for a given URL',
    yargs => {
      yargs.positional('code', {
        type: 'string',
        default: '',
        describe: 'React code to run',
      });
      yargs.positional('iterations', {
        type: 'number',
        default: 10,
        describe: 'Number of iterations to run the code for',
      });
    },
    async function (argv) {
      const code: string = String(argv['code']);
      const iterations: number = Number(argv['iterations']);

      try {
        const results = await runtimePerfTool(code, iterations);

        const formattedResults = `
# React Component Performance Results

## Mean Render Time
${calculateMean(results.renderTime)}

## Mean Web Vitals
- Cumulative Layout Shift (CLS): ${calculateMean(results.webVitals.cls)}
- Largest Contentful Paint (LCP): ${calculateMean(results.webVitals.lcp)}
- Interaction to Next Paint (INP): ${calculateMean(results.webVitals.inp)}

## Mean React Profiler
- Actual Duration: ${calculateMean(results.reactProfiler.actualDuration)}
- Base Duration: ${calculateMean(results.reactProfiler.baseDuration)}
`;

        console.log(
          JSON.stringify({
            content: [
              {
                type: 'text' as const,
                text: formattedResults,
              },
            ],
          }),
        );
      } catch (error) {
        console.log(
          JSON.stringify({
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error measuring performance: ${error.message}\n\n${error.stack}`,
              },
            ],
          }),
        );
      }
    },
  )
  .help()
  .parse(hideBin(process.argv));

function calculateMean(values: number[]): string {
  return values.length > 0
    ? values.reduce((acc, curr) => acc + curr, 0) / values.length + 'ms'
    : 'could not collect';
}
