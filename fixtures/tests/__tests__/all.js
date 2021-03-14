/** @jest-environment node */

const {spawn, exec} = require('child_process');

const NODE_14_TEST_CASES = [
  ['node-14'],
  ['node-14-jsdom'],
  ['node-14-jest-env-node'],
  ['node-14-jest-env-node-jsdom'],
  ['node-14-jest-env-jsdom'],
];

const NODE_15_TEST_CASES = [
  ['node-15'],
  ['node-15-jsdom'],
  ['node-15-jest-env-node'],
  ['node-15-jest-env-node-jsdom'],
  ['node-15-jest-env-jsdom'],
];

describe.each([
  ['Node <15', NODE_14_TEST_CASES],
  ['Node 15', NODE_15_TEST_CASES],
])('%s', (label, cases) => {
  if (process.env.DEBUG) {
    console.log('Running', label);
  }

  it.each(cases)('%s', (command, done) => {
    const test = spawn('yarn', [command], {detached: true});
    let finished = false;
    let timeout;

    function debug(...args) {
      if (!finished && process.env.DEBUG) {
        console.log(command, ...args);
      }
    }

    debug(`testing ${command}...`);

    function processResult(reason) {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        try {
          expect(command).toPass(reason);
        } finally {
          done();
        }
      }
    }

    test.stderr.on('data', data => {
      debug('err', data.toString());
      if (data.toString().indexOf('STARTED') >= 0) {
        if (!timeout) {
          debug('schduling stderr timeout');
          timeout = setTimeout(() => {
            debug('timed out in stderr, killing');
            test.kill('SIGKILL');
            processResult('TIMEOUT');
          }, 10000);
        } else {
          debug('timeout already set');
        }
      }
    });
    test.stdout.on('data', data => {
      debug('out', data.toString());
      if (data.toString().indexOf('STARTED') >= 0) {
        if (!timeout) {
          debug('schduling stdout timeout');
          timeout = setTimeout(() => {
            debug('timed out in out, killing');
            process.kill(-test.pid);
            processResult('TIMEOUT');
          }, 10000);
        } else {
          debug('timeout already set');
        }
      }
    });
    test.on('close', code => {
      debug('closed', code);

      if (code !== 0) {
        processResult('FAILED');
      } else {
        processResult('SUCCESS');
      }
    });

    test.on('error', err => {
      debug('error', err);
      processResult('ERROR');
    });

    test.on('SIGKILL', () => {
      debug('killed');
      processResult('KILLED');
    });
  });
});

expect.extend({
  toPass(command, reason) {
    const pass = reason === 'SUCCESS';
    function getCommand() {
      return `(yarn ${command})`;
    }
    if (pass) {
      return {
        message: () => `expected ${command} not to pass`,
        pass: true,
      };
    } else {
      return {
        message: () => {
          switch (reason) {
            case 'FAILED':
              return `expected ${command} to pass but it failed ${getCommand()}`;
            case 'TIMEOUT':
              return `expected ${command} to pass but it hung ${getCommand()}`;
            case 'ERROR':
              return `expected ${command} to pass but it errored ${getCommand()}`;
            default:
              return `expected ${command} to pass but it failed for an unknown reason ${reason}`;
          }
        },
        pass: false,
      };
    }
  },
});
