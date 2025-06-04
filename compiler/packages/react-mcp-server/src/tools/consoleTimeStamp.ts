import puppeteer from 'puppeteer';

/**
 * Connects to a browser and patches the console.timeStamp method to capture data
 * and send it back to the MCP server.
 *
 * @param url The URL of the page to connect to
 * @returns A promise that resolves to the captured console.timeStamp data
 */
export async function captureConsoleTimeStamp(url: string): Promise<string[]> {
  try {
    // Connect to the browser using puppeteer
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null,
    });

    // Find the page that matches the URL
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

    await targetPage.evaluateOnNewDocument(() => {
      const originalTimestamp = console.timeStamp;
      console.timeStamp = function (...args) {
        console.log('[MCP] console.timestamp called with', ...args);
        if (originalTimestamp) {
          return originalTimestamp.apply(console, args);
        }
      };

      // Inject red border and MCP overlay
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `
            html {
              border: 5px solid red !important;
            }

            #mcp-indicator {
              position: fixed;
              top: 0;
              left: 0;
              background: red;
              color: white;
              font-size: 14px;
              font-weight: bold;
              padding: 4px 8px;
              z-index: 999999;
              font-family: sans-serif;
            }
          `;
        document.head.appendChild(style);

        const indicator = document.createElement('div');
        indicator.id = 'mcp-indicator';
        indicator.textContent = 'MCP recording';
        document.body.appendChild(indicator);
      });
    });

    await targetPage.reload({waitUntil: 'domcontentloaded'});

    const capturedTimeStampData = await targetPage.evaluate(() => {
      return (window as any).__CAPTURED_TIMESTAMP_DATA__ || [];
    });

    return capturedTimeStampData;
  } catch (error) {
    throw new Error(`Failed to capture console.timeStamp data: ${error}`);
  }
}
