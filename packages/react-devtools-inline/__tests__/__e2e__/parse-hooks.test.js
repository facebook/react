'use strict';

const {test, expect} = require('@playwright/test');
const config = require('../../playwright.config');
test.use(config);

test.describe('Parsing Hook Names from React Components', () => {
  let page, frameElementHandle, frame, context;
  const inspectButtonSelector = '[class^=ToggleContent]';
  const parseHookNamesSelector = 'button[class^=ToggleOff].null';
  test.beforeAll(async ({browser}) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('http://localhost:8080/', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('iframe#target');
    frameElementHandle = await page.$('#target');
    frame = await frameElementHandle.contentFrame();
  });

  test.afterAll(async () => {
    context.close();
  });

  const extractHookNames = async selector => {
    await page.click(inspectButtonSelector, {delay: 100});
    await frame.click(selector);
    await page.click(parseHookNamesSelector);
    await page.waitForSelector('span[class^=HookName]');
    const extractedHooks = await page.$$eval('span[class^=HookName]', Hooks =>
      Hooks.map(Hook => Hook.textContent)
    );
    return extractedHooks;
  };
  test('Parse Hooks in ToDo List', async () => {
    const ToDoListHooks = [
      '(newItemText)',
      '(items)',
      '(uid)',
      '(handleClick)',
      '(handleKeyPress)',
      '(handleChange)',
      '(removeItem)',
      '(toggleItem)',
    ];
    const devtoolsHooks = await extractHookNames('h1:has-text("List")');
    expect(devtoolsHooks).toEqual(ToDoListHooks);
  });

  test.describe('Parse Hook Names in CustomHooks Component', () => {
    const customHooks = [
      '(count)',
      '(contextValueA)',
      '(_)',
      '(debouncedCount)',
      '(debouncedValue)',
      '(onClick)',
      '(contextValueB)',
    ];

    test('Parse Hooks in CustomHooks', async () => {
      const devToolsHooks = await extractHookNames('#customHooksButton');
      expect(devToolsHooks).toEqual(customHooks);
    });

    test('Parse Hooks in CustomHooks with Memo', async () => {
      const devToolsHooks = await extractHookNames('#customHooksButtonMemo');
      expect(devToolsHooks).toEqual(customHooks);
    });

    test('Parse Hooks in CustomHooks with ForwardRefs', async () => {
      const devToolsHooks = await extractHookNames(
        '#customHooksButtonForwardRef'
      );
      expect(devToolsHooks).toEqual(customHooks);
    });

    test('Parse Hooks in CustomHooks with Hoc', async () => {
      const devToolsHooks = await extractHookNames('#customHooksButtonwithHoc');
      expect(devToolsHooks).toEqual(customHooks);
    });
  });

  test('Parse Hooks in DeepHooks component', async () => {
    const DeepHooks = [
      '(foo)',
      '(foo)',
      '(value)',
      '(bar)',
      '(bar)',
      '(count)',
      '(baz)',
      '(count)',
    ];
    const devtoolsHooks = await extractHookNames('ul#DeepHooks');
    expect(devtoolsHooks).toEqual(DeepHooks);
  });

  test('Parse Hooks in StatefulFunction component', async () => {
    const StatefulFunctionHooks = [
      '(count)',
      '(debouncedCount)',
      '(debouncedValue)',
      '(handleUpdateCountClick)',
      '(data)',
      '(handleUpdateReducerClick)',
    ];
    const devtoolsHooks = await extractHookNames('ul#StatefulFunction');
    expect(devtoolsHooks).toEqual(StatefulFunctionHooks);
  });

  test('Parse Hooks in ReactNativeWeb', async () => {
    const ReactNativeWebHooks = ['(backgroundColor)'];
    const devtoolsHooks = await extractHookNames(
      'h1:has-text("ReactNativeWeb")'
    );
    expect(devtoolsHooks).toEqual(ReactNativeWebHooks);
  });
});
