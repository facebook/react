/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
const puppeteer = require('puppeteer');

let child;

describe('DOMAttributeBehavior', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (child) {
      // Kill the child process and its subprocesses
      process.kill(-child.pid, 'SIGINT');
    }
  });

  async function testAttributeBehavior(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const result = await page.evaluate(() => {
      return window.test();
    });
    expect(result).toMatchSnapshot();
  }

  it(
    'works',
    done => {
      if (!ReactDOMFeatureFlags.useFiber) {
        done();
        return;
      }
      const path = require('path');
      const {execSync, spawn} = require('child_process');

      const cwd = path.resolve(process.cwd(), 'fixtures/attribute-behavior');

      execSync('yarn', {cwd});

      process.env.BROWSER = 'none';
      process.env.PORT = 9292;

      child = spawn('yarn', ['start'], {cwd, detached: true});

      let didStartTest = false;
      child.stdout.on('data', data => {
        const str = data.toString('utf8');
        if (str.includes('Failed')) {
          console.error('Failure on CRA startup');
          done();
          return;
        }

        if (!didStartTest && str.includes('http://localhost:9292/')) {
          didStartTest = true;
          testAttributeBehavior('http://localhost:9292/headless')
            .then(() => done())
            .catch(error => {
              console.error(error);
              done();
            });
        }
      });
    },
    30000,
  );
});
