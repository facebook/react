/** @flow */

'use strict';

const {runOnlyForReactRange} = require('./utils');
const listAppUtils = require('./list-app-utils');
const devToolsUtils = require('./devtools-utils');
const {test, expect} = require('@playwright/test');
const config = require('../../playwright.config');
const semver = require('semver');
test.use(config);
test.describe('Components', () => {
  let page;

  test.beforeEach(async ({browser}) => {
    page = await browser.newPage();

    await page.goto(config.use.url, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('#iframe');

    await devToolsUtils.clickButton(page, 'TabBarButton-components');
  });

  test('Should display initial React components', async () => {
    const appRowCount = await page.evaluate(() => {
      const {createTestNameSelector, findAllNodes} = window.REACT_DOM_APP;
      const container = document.getElementById('iframe').contentDocument;
      const rows = findAllNodes(container, [
        createTestNameSelector('ListItem'),
      ]);
      return rows.length;
    });
    expect(appRowCount).toBe(3);

    const devToolsRowCount = await devToolsUtils.getElementCount(
      page,
      'ListItem'
    );
    expect(devToolsRowCount).toBe(3);
  });

  test('Should display newly added React components', async () => {
    await listAppUtils.addItem(page, 'four');

    const count = await devToolsUtils.getElementCount(page, 'ListItem');
    expect(count).toBe(4);
  });

  test('Should allow elements to be inspected', async () => {
    // Select the first list item in DevTools.
    await devToolsUtils.selectElement(page, 'ListItem', 'List\nApp');

    // Prop names/values may not be editable based on the React version.
    // If they're not editable, make sure they degrade gracefully
    const isEditableName = semver.gte(config.use.react_version, '17.0.0');
    const isEditableValue = semver.gte(config.use.react_version, '16.8.0');

    // Then read the inspected values.
    const [propName, propValue, sourceText] = await page.evaluate(
      isEditable => {
        const {createTestNameSelector, findAllNodes} =
          window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        // Get name of first prop
        const selectorName = isEditable.name
          ? 'EditableName'
          : 'NonEditableName';
        const nameElement = findAllNodes(container, [
          createTestNameSelector('InspectedElementPropsTree'),
          createTestNameSelector(selectorName),
        ])[0];
        const name = isEditable.name
          ? nameElement.value
          : nameElement.innerText;

        // Get value of first prop
        const selectorValue = isEditable.value
          ? 'EditableValue'
          : 'NonEditableValue';
        const valueElement = findAllNodes(container, [
          createTestNameSelector('InspectedElementPropsTree'),
          createTestNameSelector(selectorValue),
        ])[0];
        const source = findAllNodes(container, [
          createTestNameSelector('InspectedElementView-Source'),
        ])[0];
        const value = isEditable.value
          ? valueElement.value
          : valueElement.innerText;

        return [name, value, source.innerText];
      },
      {name: isEditableName, value: isEditableValue}
    );

    expect(propName).toBe('label');
    expect(propValue).toBe('"one"');
    expect(sourceText).toMatch(/ListApp[a-zA-Z]*\.js/);
  });

  test('should allow props to be edited', async () => {
    runOnlyForReactRange('>=16.8');

    // Select the first list item in DevTools.
    await devToolsUtils.selectElement(page, 'ListItem', 'List\nApp');

    // Then edit the label prop.
    await page.evaluate(() => {
      const {createTestNameSelector, focusWithin} = window.REACT_DOM_DEVTOOLS;
      const container = document.getElementById('devtools');

      focusWithin(container, [
        createTestNameSelector('InspectedElementPropsTree'),
        createTestNameSelector('EditableValue'),
      ]);
    });

    page.keyboard.press('Backspace'); // "
    page.keyboard.press('Backspace'); // e
    page.keyboard.press('Backspace'); // n
    page.keyboard.press('Backspace'); // o
    page.keyboard.insertText('new"');
    page.keyboard.press('Enter');

    await page.waitForFunction(() => {
      const {createTestNameSelector, findAllNodes} = window.REACT_DOM_APP;
      const container = document.getElementById('iframe').contentDocument;
      const rows = findAllNodes(container, [
        createTestNameSelector('ListItem'),
      ])[0];
      return rows.innerText === 'new';
    });
  });

  test('should load and parse hook names for the inspected element', async () => {
    runOnlyForReactRange('>=16.8');

    // Select the List component DevTools.
    await devToolsUtils.selectElement(page, 'List', 'App');

    // Then click to load and parse hook names.
    await devToolsUtils.clickButton(page, 'LoadHookNamesButton');

    // Make sure the expected hook names are parsed and displayed eventually.
    await page.waitForFunction(
      hookNames => {
        const {createTestNameSelector, findAllNodes} =
          window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        const hooksTree = findAllNodes(container, [
          createTestNameSelector('InspectedElementHooksTree'),
        ])[0];

        if (!hooksTree) {
          return false;
        }

        const hooksTreeText = hooksTree.innerText;

        for (let i = 0; i < hookNames.length; i++) {
          if (!hooksTreeText.includes(hookNames[i])) {
            return false;
          }
        }

        return true;
      },
      ['State(items)', 'Ref(inputRef)']
    );
  });

  test('should allow searching for component by name', async () => {
    async function getComponentSearchResultsCount() {
      return await page.evaluate(() => {
        const {createTestNameSelector, findAllNodes} =
          window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        const element = findAllNodes(container, [
          createTestNameSelector('ComponentSearchInput-ResultsCount'),
        ])[0];
        return element.innerText;
      });
    }

    async function focusComponentSearch() {
      await page.evaluate(() => {
        const {createTestNameSelector, focusWithin} = window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        focusWithin(container, [
          createTestNameSelector('ComponentSearchInput-Input'),
        ]);
      });
    }

    await focusComponentSearch();
    page.keyboard.insertText('List');
    let count = await getComponentSearchResultsCount();
    expect(count).toBe('1 | 4');

    page.keyboard.insertText('Item');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('1 | 3');

    page.keyboard.press('Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('2 | 3');

    page.keyboard.press('Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('3 | 3');

    page.keyboard.press('Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('1 | 3');

    page.keyboard.press('Shift+Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('3 | 3');

    page.keyboard.press('Shift+Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('2 | 3');

    page.keyboard.press('Shift+Enter');
    count = await getComponentSearchResultsCount();
    expect(count).toBe('1 | 3');
  });
});
