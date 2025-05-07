import * as babel from '@babel/core';
import puppeteer from 'puppeteer';
import {readFileSync} from 'fs';
import * as path from 'path';
// @ts-ignore
import * as babelPresetTypescript from '@babel/preset-typescript';
// @ts-ignore
import * as babelPresetEnv from '@babel/preset-env';
// @ts-ignore
import * as babelPresetReact from '@babel/preset-react';

function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export async function parseReactComponentTree(code: string): Promise<string> {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });

  const pages = await browser.pages();

  let localhostPage = null;
  for (const page of pages) {
    const url = await page.url();

    if (url.startsWith('https://react.dev')) {
      localhostPage = page;
      break;
    }
  }

  if (localhostPage) {
    const devtoolsHook = await localhostPage.evaluate(getReactComponentTree);
    console.log(devtoolsHook);

    return new Promise(resolve => resolve(JSON.stringify(devtoolsHook)));
  } else {
    throw new Error('Localhost page not found');
  }
}

function getReactComponentTree() {
  // Check if the React DevTools hook is available
  const hook: any = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    console.error(
      'React DevTools hook is not available. Make sure React DevTools extension is installed.',
    );
    return null;
  }

  // Get the first renderer from the DevTools hook
  const renderers: any = Array.from(hook.renderers.values());

  // return renderers;

  if (renderers.length === 0) {
    console.error('No React renderers found.');
    return null;
  }

  const rootFiber = Array.from(
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(1),
  )[0];

  //ROOT FIBER
  if (!rootFiber) {
    return 'error';
  }
}

parseReactComponentTree('')
  .then(result => console.log(result))
  .catch(error => console.error(error));
