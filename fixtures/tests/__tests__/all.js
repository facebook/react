/** @jest-environment node */

const {spawn, exec, execSync} = require('child_process');
const chalk = require('chalk');

const TIME_TO_WAIT_FOR_HANG = 5000; //5s

const NODE_TEST_CASES = [
  ['Node 14', 'node-14'],
  ['Node 15', 'node-15'],
];

const TEST_CASES = [
  ['node-node'],
  ['node-jsdom'],
  ['jest-env-node'],
  ['jest-env-jsdom'],
  ['jest-env-node-jsdom'],
];

const SCHEDULER_TEST_CASES = [
  ['Scheduler in stable', 'stable'],
  ['Scheduler on main', 'main'],
  ['Scheduler in PR (recommended for React 18)', 'pr'],
  ['Scheduler recommended for 17.1.0', '17'],
];

describe.each(SCHEDULER_TEST_CASES)('%s', (label, copyCommand) => {
  beforeEach(() => {
    const result = execSync(`yarn ${copyCommand}`);
  });

  describe.each(NODE_TEST_CASES)('%s', (label, nodeVersion) => {
    it.each(TEST_CASES)(`${nodeVersion}-%s`, command => {
      function processResult(reason) {
        expect(`${nodeVersion}-${command}`).toPass(reason);
      }

      try {
        const result = execSync(`yarn ${nodeVersion}-${command}`, {
          detached: true,
          timeout: TIME_TO_WAIT_FOR_HANG,
        });
        processResult('SUCCESS');
      } catch (e) {
        if (e.message.indexOf('ETIMEDOUT') > -1) {
          processResult('TIMEOUT');
        } else {
          console.error(e.message);
          processResult('FAILED');
        }
      }
    });
  });
});

expect.extend({
  toPass(command, reason) {
    const pass = reason === 'SUCCESS';
    function getCommand() {
      return chalk.dim(`(run with: yarn ${command})`);
    }
    if (pass) {
      return {
        message: () => `Expected ${command} not to pass`,
        pass: true,
      };
    } else {
      return {
        message: () => {
          switch (reason) {
            case 'FAILED':
              return `Expected ${chalk.red(command)} to pass but it ${chalk.red(
                'failed'
              )} ${getCommand()}`;
            case 'TIMEOUT':
              return `Expected ${chalk.red(command)} to pass but it ${chalk.red(
                'hung'
              )} ${getCommand()}`;
            case 'ERROR':
              return `Expected ${chalk.red(command)} to pass but it ${chalk.red(
                'errored'
              )} ${getCommand()}`;
            default:
              return `Expected ${chalk.red(
                command
              )} to pass but it failed for an ${chalk.red(
                'unknown reason'
              )} ${reason}`;
          }
        },
        pass: false,
      };
    }
  },
});
