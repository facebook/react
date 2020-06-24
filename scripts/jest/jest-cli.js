'use strict';

const {spawn} = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs');

const configMap = {
  oss: './scripts/jest/config.source.js',
  www: './scripts/jest/config.source-www.js',
  devtools: './scripts/jest/config.build-devtools.js',
};

// TODO: These configs are separate but should be rolled into the configs above
// so that the CLI can provide them as options for any of the configs.
const persistentConfig = './scripts/jest/config.source-persistent.js';
const buildConfig = './scripts/jest/config.build.js';

const argv = yargs
  .parserConfiguration({
    // Important: This option tells yargs to move all other options not
    // specified here into the `_` key. We use this to send all of the
    // Jest options that we don't use through to Jest (like --watch).
    'unknown-options-as-args': true,
  })
  .wrap(yargs.terminalWidth())
  .options({
    debug: {
      alias: 'd',
      describe: 'Run with node debugger attached.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    project: {
      alias: 'p',
      describe: 'Run the given project.',
      requiresArg: false,
      type: 'string',
      default: 'oss',
      choices: Object.keys(configMap),
    },
    releaseChannel: {
      alias: 'r',
      describe: 'Run with the given release channel.',
      requiresArg: false,
      type: 'string',
      default: 'experimental',
      choices: ['experimental', 'stable'],
    },
    env: {
      alias: 'e',
      describe: 'Run with the given node environment.',
      requiresArg: false,
      type: 'string',
      choices: ['development', 'production'],
    },
    prod: {
      describe: 'Run with NODE_ENV=production.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    dev: {
      describe: 'Run with NODE_ENV=development.',
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
    build: {
      alias: 'b',
      describe: 'Run tests on builds.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    persistent: {
      alias: 'n',
      describe: 'Run with persistence.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    ci: {
      describe: 'Run tests in CI',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
  }).argv;

function logError(message) {
  console.error(chalk.red(`\n${message}`));
}
function validateOptions() {
  let success = true;
  if (argv.variant && argv.project !== 'www') {
    logError(
      'Variant is only supported for the www config. Update these options to continue.'
    );
    success = false;
  }

  if (argv.prod && argv.project === 'devtools') {
    logError('DevTools do not support --prod. Remove this option to continue.');
    success = false;
  }

  if (argv.env === 'production' && argv.project === 'devtools') {
    logError(
      'DevTools do not support --env=production. Remove this option to continue.'
    );
    success = false;
  }

  if (argv.build && argv.persistent) {
    logError(
      'Persistence is not supported for build targets. Update these options to continue.'
    );
    success = false;
  }

  if (argv.project !== 'oss' && argv.persistent) {
    logError(
      'Persistence only supported for oss configs. Update these options to continue.'
    );
    success = false;
  }

  if (argv.build && argv.project !== 'oss' && argv.project !== 'devtools') {
    logError(
      'Build targets are only supported for oss and devtools configs. Update these options to continue.'
    );
    success = false;
  }

  if (!argv.build && argv.project === 'devtools') {
    logError(
      'Source target is not supported devtools. Remove this option to continue.'
    );
    success = false;
  }

  if (argv.env && argv.env !== 'production' && argv.prod) {
    logError(
      'Build type does not match --prod. Update these options to continue.'
    );
    success = false;
  }

  if (argv.env && argv.env !== 'development' && argv.dev) {
    logError(
      'Build type does not match --dev. Update these options to continue.'
    );
    success = false;
  }

  if (argv.prod && argv.dev) {
    logError(
      'Cannot supply both --prod and --dev. Remove one of these options to continue.'
    );
    success = false;
  }

  if (!success) {
    console.log(''); // Extra newline.
    process.exit(1);
  }
}

function getCommandArgs() {
  // Add the correct Jest config.
  const args = ['./scripts/jest/jest.js', '--config'];
  if (argv.build) {
    args.push(buildConfig);
  } else if (argv.persistent) {
    args.push(persistentConfig);
  } else {
    args.push(configMap[argv.project]);
  }

  if (argv.build) {
    // TODO: We could build this if it hasn't been built yet.
    console.log(
      'Running build tests, please remember to run `yarn build` first.'
    );
  }

  // Set the debug options, if necessary.
  if (argv.debug) {
    args.unshift('--inspect-brk');
    args.push('--runInBand');
  }

  // CI Environments have limited workers.
  if (argv.ci) {
    args.push('--maxWorkers=2');
  }

  // Push the remaining args onto the command.
  // This will send args like `--watch` to Jest.
  args.push(argv._);

  return args;
}

function getEnvars() {
  const envars = {
    NODE_ENV: argv.env || 'development',
    RELEASE_CHANNEL: argv.releaseChannel,
  };

  if (argv.prod) {
    envars.NODE_ENV = 'production';
  }

  if (argv.dev) {
    envars.NODE_ENV = 'development';
  }

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
      `$ ${Object.keys(envars)
        .map(envar => `${envar}=${envars[envar]}`)
        .join(' ')}`,
      'node',
      args.join(' ')
    )
  );

  // Print the release channel and project we're running for quick confirmation.
  console.log(
    chalk.blue(
      `\nRunning tests for ${argv.project} (${argv.releaseChannel})...`
    )
  );

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
