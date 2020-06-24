'use strict';

const {spawn} = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs');

const configMap = {
  source: './scripts/jest/config.source.js',
  www: './scripts/jest/config.source-www.js',
  persist: './scripts/jest/config.source-persistent.js',
  build: './scripts/jest/config.build.js',
  devtools: './scripts/jest/config.build-devtools.js',
};

const argv = yargs
  .parserConfiguration({
    // Important: This option tells yargs to move all other options not
    // specified here into the `_` key. We use this to send all of the
    // Jest options that we don't use through to Jest (like --watch).
    'unknown-options-as-args': true,
  })
  .options({
    debug: {
      alias: 'd',
      describe: 'Run with node debugger attached.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    prod: {
      alias: 'p',
      describe: 'Run with NODE_ENV=production.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    variant: {
      alias: 'v',
      describe: 'Run with www variant set to true.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    config: {
      alias: 'c',
      describe: 'Run with the given config.',
      requiresArg: false,
      type: 'string',
      default: 'source',
      choices: Object.keys(configMap),
    },
  }).argv;

function validateOptions() {
  if (argv.variant && argv.config !== 'www') {
    console.error(
      chalk.red('\nVariant is only supported for the www config.\n')
    );
    process.exit(1);
  }

  if (argv.prod && argv.config === 'devtools') {
    console.error(
      chalk.red(
        '\nDevTools do not support --prod, remove this option to continue.\n'
      )
    );
    process.exit(1);
  }
}

function getCommandArgs() {
  // Add the correct Jest config.
  const args = ['./scripts/jest/jest.js', '--config'];
  args.push(configMap[argv.config]);

  // Set the debug options, if necessary.
  if (argv.debug) {
    args.unshift('--inspect-brk');
    args.push('--runInBand');
  }

  // Push the remaining args onto the command.
  // This will send args like `--watch` to Jest.
  args.push(argv._);

  return args;
}

function getEnvars() {
  const envars = {
    NODE_ENV: argv.prod ? 'production' : 'development',
  };

  if (argv.variant) {
    envars.VARIANT = true;
  }

  return envars;
}

function main() {
  validateOptions();
  const args = getCommandArgs();
  const envars = getEnvars();

  // Print the full command we're actually running.
  console.log(
    chalk.dim(
      `$ NODE_ENV=${envars.NODE_ENV}${envars.VARIANT ? ' VARIANT=true' : ''}`,
      'node',
      args.join(' ')
    )
  );

  // Print the config we're running for quick confirmation.
  console.log(chalk.blue(`\nRunning test for ${argv.config}...`));

  // Print a message that the debugger is starting just
  // for some extra feedback when running the debugger.
  if (argv.debug) {
    console.log(chalk.green('\nStarting debugger...'));
    console.log(chalk.green('Open chrome://inspect and press "inspect"\n'));
  }

  // Run Jest.
  spawn('node', args, {stdio: 'inherit', env: {...envars, ...process.env}});
}

main();
