'use strict';

const {test, expect} = require('@playwright/test');
const config = require('../../playwright.config');
test.use(config);

test.describe('Parsing Hook Names from React Components', () => {
  let page, frameElementHandle, frame;
  test.beforeAll(async ({browser}) => {
    page = await browser.newPage();
    await page.goto('http://localhost:8080/', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('iframe#target');
    frameElementHandle = await page.$('#target');
    frame = await frameElementHandle.contentFrame();
  });
  test('Parse Hooks in ToDo List', async () => {
    const ToDoListHooks = [
      '(newItemText)',
      '(items)',
      '(uid)',
      '(handleClick)',
      '(handleKeyPress)',
      '(handleChange)',
      '(removeItem)',
      '(toggleItem)'
    ];
    await page.click('[class^=ToggleContent]', {delay: 100});
    await frame.click('h1:has-text("List")');
    await page.click('button[class^=ToggleOff].null');
    await page.waitForSelector('span[class^=HookName]');
    const devToolsHooks = await page.$$eval('span[class^=HookName]',Hooks => Hooks.map(Hook => Hook.textContent))
    expect(devToolsHooks).toEqual(ToDoListHooks);
  });
})
