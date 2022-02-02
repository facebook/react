/** @flow */

'use strict';

const listAppUtils = require('./list-app-utils');
const devToolsUtils = require('./devtools-utils');
const {test, expect} = require('@playwright/test');
const config = require('../../playwright.config');
test.use(config);
test.describe('Profiler', () => {
  let page;

  test.beforeEach(async ({browser}) => {
    page = await browser.newPage();

    await page.goto('http://localhost:8080/e2e.html', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('#iframe');

    await devToolsUtils.clickButton(page, 'TabBarButton-profiler');
  });

  test('should record renders and commits when active', async () => {
    async function getSnapshotSelectorText() {
      return await page.evaluate(() => {
        const {
          createTestNameSelector,
          findAllNodes,
        } = window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        const input = findAllNodes(container, [
          createTestNameSelector('SnapshotSelector-Input'),
        ])[0];
        const label = findAllNodes(container, [
          createTestNameSelector('SnapshotSelector-Label'),
        ])[0];
        return `${input.value}${label.innerText}`;
      });
    }

    async function clickButtonAndVerifySnapshotSelectorText(
      buttonTagName,
      expectedText
    ) {
      await devToolsUtils.clickButton(page, buttonTagName);
      const text = await getSnapshotSelectorText();
      expect(text).toBe(expectedText);
    }

    await devToolsUtils.clickButton(page, 'ProfilerToggleButton');

    await listAppUtils.addItem(page, 'four');
    await listAppUtils.addItem(page, 'five');
    await listAppUtils.addItem(page, 'six');

    await devToolsUtils.clickButton(page, 'ProfilerToggleButton');

    await page.waitForFunction(() => {
      const {createTestNameSelector, findAllNodes} = window.REACT_DOM_DEVTOOLS;
      const container = document.getElementById('devtools');

      const input = findAllNodes(container, [
        createTestNameSelector('SnapshotSelector-Input'),
      ]);

      return input.length === 1;
    });

    const text = await getSnapshotSelectorText();
    expect(text).toBe('1 / 3');

    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-NextButton',
      '2 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-NextButton',
      '3 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-NextButton',
      '1 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-PreviousButton',
      '3 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-PreviousButton',
      '2 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-PreviousButton',
      '1 / 3'
    );
    await clickButtonAndVerifySnapshotSelectorText(
      'SnapshotSelector-PreviousButton',
      '3 / 3'
    );
  });
});
