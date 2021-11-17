'use strict';

const {test, expect} = require('@playwright/test');
const config = require('../../playwright.config');
test.use(config);

test.describe('Testing Todo-List App', () => {
  let page, frameElementHandle, frame;
  test.beforeAll(async ({browser}) => {
    page = await browser.newPage();
    await page.goto('http://localhost:8080/', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('iframe#target');
    frameElementHandle = await page.$('#target');
    frame = await frameElementHandle.contentFrame();
  });

  test('The Todo List should contain 3 items by default', async () => {
    const list = frame.locator('.listitem');
    await expect(list).toHaveCount(3);
  });

  test('Add another item Fourth to list', async () => {
    await frame.type('.input', 'Fourth');
    await frame.click('button.iconbutton');
    const listItems = await frame.locator('.label');
    await expect(listItems).toHaveText(['First', 'Second', 'Third', 'Fourth']);
  });

  test('Inspecting list elements with devtools', async () => {
    // Component props are used as string in devtools.
    const listItemsProps = [
      '',
      '{id: 1, isComplete: true, text: "First"}',
      '{id: 2, isComplete: true, text: "Second"}',
      '{id: 3, isComplete: false, text: "Third"}',
      '{id: 4, isComplete: false, text: "Fourth"}',
    ];
    const countOfItems = await frame.$$eval('.listitem', el => el.length);
    // For every item in list click on devtools inspect icon
    // click on the list item to quickly navigate to the list item component in devtools
    // comparing displayed props with the array of props.
    for (let i = 1; i <= countOfItems; ++i) {
      await page.click('[class^=ToggleContent]', {delay: 100});
      await frame.click(`.listitem:nth-child(${i})`, {delay: 50});
      await page.waitForSelector('span.Value___tNzum');
      const text = await page.innerText('span[class^=Value]');
      await expect(text).toEqual(listItemsProps[i]);
    }
  });
});
