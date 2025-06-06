import puppeteer, {Page} from 'puppeteer';

export async function hookIntoPage(url: string): Promise<Page> {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });

  const pages = await browser.pages();
  let targetPage = null;
  for (const page of pages) {
    const pageUrl = await page.url();
    if (pageUrl.startsWith(url)) {
      targetPage = page;
      break;
    }
  }

  if (!targetPage) {
    throw new Error(
      `Could not open the page at ${url}. Is your server running?`,
    );
  }

  return targetPage;
}
