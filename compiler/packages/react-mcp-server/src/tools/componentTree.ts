import puppeteer from 'puppeteer';
import extractComponentTreeFromDevTools from '../utils/reactDevTools/extractComponentTree';
// import {generateComponentTree} from '../utils/reactDevTools/reactDevTools';

function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export async function parseReactComponentTree(): Promise<string> {
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
    const devtoolsHook = await localhostPage.evaluate(
      () => (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
    );

    try {
    } catch (error) {
      console.error(error);
    }

    extractComponentTreeFromDevTools(devtoolsHook);

    return new Promise(resolve => resolve(JSON.stringify(devtoolsHook)));
  } else {
    throw new Error('Localhost page not found');
  }
}

parseReactComponentTree()
  .then(result => console.log(result))
  .catch(error => console.error(error));
