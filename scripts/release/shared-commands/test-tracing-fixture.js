#!/usr/bin/env node

'use strict';

const {join} = require('path');
const puppeteer = require('puppeteer');
const theme = require('../theme');
const {logPromise} = require('../utils');

const validate = async ({cwd}) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    'file://' + join(cwd, 'fixtures/tracing/index.html?puppeteer=true')
  );

  try {
    return await page.evaluate(() => {
      const button = document.getElementById('run-test-button');
      button.click();

      const items = document.querySelectorAll('[data-value]');

      if (items.length === 0) {
        return 'No results were found.';
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.getAttribute('data-value') !== 'All checks pass') {
          return `Unexpected result, "${item.getAttribute('data-value')}"`;
        }
      }

      return null;
    });
  } finally {
    await browser.close();
  }
};

const run = async ({cwd}) => {
  const errorMessage = await logPromise(
    validate({cwd}),
    'Verifying "scheduler/tracing" fixture'
  );
  if (errorMessage) {
    console.error(theme.error(errorMessage));
    process.exit(1);
  }
};

module.exports = run;
