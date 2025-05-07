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

    if (url.startsWith('http://localhost:3000')) {
      localhostPage = page;
      break;
    }
  }

  if (localhostPage) {
    const isDevtoolsLoaded = await localhostPage.evaluate(() => {
      return !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    });

    return new Promise(resolve =>
      resolve(isDevtoolsLoaded === true ? 'YES <3' : 'NO :('),
    );
  } else {
    throw new Error('Localhost page not found');
  }
}

parseReactComponentTree('')
  .then(result => console.log(result))
  .catch(error => console.error(error));
