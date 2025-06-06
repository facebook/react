import puppeteer from 'puppeteer';
import {hookIntoPage} from '../utils/puppeteerUtils';

/**
 * Connects to a browser and patches the console.timeStamp method to capture data
 * and send it back to the MCP server.
 *
 * @param url The URL of the page to connect to
 * @returns A promise that resolves to the captured console.timeStamp data
 */
export async function beginPerfRecording(url: string): Promise<string[]> {
  try {
    const targetPage = await hookIntoPage(url);

    await targetPage.evaluateOnNewDocument(() => {
      (window as any).__CAPTURED_TIMESTAMP_DATA__ = [];
      (window as any).__MCP_RECORDING_ACTIVE__ = true;

      const originalTimestamp = console.timeStamp;

      // Monkey-patch console.timeStamp to capture data
      console.timeStamp = function (...args) {
        if ((window as any).__MCP_RECORDING_ACTIVE__) {
          console.log('[MCP] console.timestamp called with', ...args);
          (window as any).__CAPTURED_TIMESTAMP_DATA__.push(args);
        }

        if (originalTimestamp) {
          return originalTimestamp.apply(console, args);
        }
      };

      (window as any).__STOP_MCP_RECORDING__ = function () {
        (window as any).__MCP_RECORDING_ACTIVE__ = false;

        const mcpStyle = document.getElementById('mcp-style');
        const mcpIndicator = document.getElementById('mcp-indicator');

        if (mcpStyle) mcpStyle.remove();
        if (mcpIndicator) mcpIndicator.remove();

        console.log(
          '[MCP] Recording stopped, captured data:',
          (window as any).__CAPTURED_TIMESTAMP_DATA__,
        );
        return (window as any).__CAPTURED_TIMESTAMP_DATA__;
      };

      window.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('mcp-style')) {
          const style = document.createElement('style');
          style.id = 'mcp-style';
          style.textContent = `
              html {
                border: 3px solid red !important;
              }

              #mcp-indicator {
                position: fixed;
                bottom: 0;
                right: 0;
                background: red;
                color: white;
                font-size: 14px;
                font-weight: bold;
                padding: 4px 8px;
                z-index: 999999;
                font-family: sans-serif;
                display: flex;
                align-items: center;
              }

              #mcp-stop-button {
                margin-left: 8px;
                background: white;
                color: red;
                border: none;
                border-radius: 4px;
                padding: 2px 6px;
                cursor: pointer;
                font-weight: bold;
              }
            `;
          document.head.appendChild(style);
        }

        if (!document.getElementById('mcp-indicator')) {
          const indicator = document.createElement('div');
          indicator.id = 'mcp-indicator';

          const recordingText = document.createElement('span');
          recordingText.textContent = 'MCP recording';
          indicator.appendChild(recordingText);

          const stopButton = document.createElement('button');
          stopButton.id = 'mcp-stop-button';
          stopButton.textContent = 'Stop';
          stopButton.onclick = () => {
            (window as any).__STOP_MCP_RECORDING__();
          };
          indicator.appendChild(stopButton);

          document.body.appendChild(indicator);
        }
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

export async function getPerfData(url: string): Promise<string[]> {
  const page = await hookIntoPage(url);

  return await page.evaluate(() => {
    return (window as any).__CAPTURED_TIMESTAMP_DATA__;
  });
}
