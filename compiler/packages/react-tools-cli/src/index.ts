import {devDocsTool} from 'react-mcp-server/src';

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

yargs()
  .scriptName('react-tools-cli')
  .usage('$0 <cmd> [args]')
  .command(
    'compile [code]',
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
      // const passName: PassNameType = argv['pass-name'] as PassNameType

      const results = devDocsTool(code);

      // switch (results.kind) {
      //   case 'success': {
      //     console.log(JSON.stringify({
      //       isError: false,
      //       content: results.content.map(text => {
      //         return {
      //           type: 'text' as const,
      //           text,
      //         };
      //       }),
      //     }));
      //     break
      //   }
      //   case 'bailout': {
      //     console.log(JSON.stringify({
      //       isError: true,
      //       content: results.content.map(text => {
      //         return {
      //           type: 'text' as const,
      //           text,
      //         };
      //       }),
      //     }));
      //     break;
      //   }
      //   case 'error':
      //   case 'compile-error':
      //     console.log(JSON.stringify({
      //       isError: true,
      //       content: [
      //         {
      //           type: 'text' as const,
      //           text: results.text,
      //         },
      //       ],
      //     }));
      //     break;
      //   default:
      //     assertExhaustive(
      //       results,
      //       `Unhandled result ${JSON.stringify(results)}`,
      //     );
      // }
    },
  )
  .help()
  .parse(hideBin(process.argv));
