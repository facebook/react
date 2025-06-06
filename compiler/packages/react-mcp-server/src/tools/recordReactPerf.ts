import puppeteer from 'puppeteer';
import {hookIntoPage} from '../utils/puppeteerUtils';
import fs from 'fs/promises';
import path from 'path';

/**
 * Connects to a browser and patches the console.timeStamp method to capture data
 * and send it back to the MCP server.
 *
 * @param url The URL of the page to connect to
 * @returns A promise that resolves to the captured console.timeStamp data
 */
export async function beginPerfRecording(url: string): Promise<string> {
  try {
    const targetPage = await hookIntoPage(url);

    await targetPage.evaluateOnNewDocument(() => {
      (window as any).__COMPONENT_TRACK_TIMESTAMP_DATA__ = [];
      (window as any).__SCHEDULER_TRACK_TIMESTAMP_DATA__ = [];
      (window as any).__MCP_RECORDING_ACTIVE__ = true;

      const originalTimestamp = console.timeStamp;

      // Monkey-patch console.timeStamp to capture data
      console.timeStamp = function (...args: any) {
        if ((window as any).__MCP_RECORDING_ACTIVE__) {
          console.log('[MCP] console.timestamp called with', ...args);

          if ((args[4] as string)?.includes('Scheduler')) {
            const timeStampData = {
              name: args[0],
              startTime: args[1],
              endTime: args[2],
              type: args[3],
              track: 'Scheduler',
              color: args[5],
            };
            (window as any).__SCHEDULER_TRACK_TIMESTAMP_DATA__.push(
              timeStampData,
            );
          } else if ((args[3] as string)?.includes('Components')) {
            const timeStampData = {
              name: args[0],
              startTime: args[1],
              endTime: args[2],
              track: 'Components',
              color: args[4],
            };
            (window as any).__COMPONENT_TRACK_TIMESTAMP_DATA__.push(
              timeStampData,
            );
          } else {
            console.log('[MCP] Unknown track format:', args);
          }
        }

        if (originalTimestamp) {
          return originalTimestamp.apply(console, args as any);
        }
      };

      (window as any).__STOP_MCP_RECORDING__ = function () {
        (window as any).__MCP_RECORDING_ACTIVE__ = false;

        const mcpStyle = document.getElementById('mcp-style');
        const mcpIndicator = document.getElementById('mcp-indicator');

        if (mcpStyle) mcpStyle.remove();
        if (mcpIndicator) mcpIndicator.remove();

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

    return 'Recording Successfully Started';
  } catch (error) {
    throw new Error(`Failed to capture console.timeStamp data: ${error}`);
  }
}

export async function getPerfData(url: string): Promise<string> {
  try {
    const page = await hookIntoPage(url);

    // Get both timestamp data tracks from the browser
    const [componentTrackData, schedulerTrackData] = await page.evaluate(() => {
      return [
        (window as any).__COMPONENT_TRACK_TIMESTAMP_DATA__ || [],
        (window as any).__SCHEDULER_TRACK_TIMESTAMP_DATA__ || [],
      ];
    });

    if (
      (!Array.isArray(componentTrackData) || componentTrackData.length === 0) &&
      (!Array.isArray(schedulerTrackData) || schedulerTrackData.length === 0)
    ) {
      return 'No performance data was captured. Make sure to run start-react-performance-recording first.';
    }

    // Create a timestamp for the filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const artifactsDir = path.join(__dirname, '../src/artifacts');

    // Ensure the artifacts directory exists
    try {
      await fs.mkdir(artifactsDir, {recursive: true});
    } catch (err) {
      console.error(`Error creating directory: ${err}`);
    }

    const results = [];

    // Process Component Track data
    if (Array.isArray(componentTrackData) && componentTrackData.length > 0) {
      const componentFilename = `react-component-track-${timestamp}.csv`;
      const componentFilePath = path.join(artifactsDir, componentFilename);

      // Define headers for component track
      const componentHeaders = [
        'name',
        'startTime',
        'endTime',
        'track',
        'color',
      ].join(',');

      // Convert data to CSV rows
      const componentRows = componentTrackData.map(item => {
        return componentHeaders
          .split(',')
          .map(header => {
            const value = item[header];
            // Handle undefined values
            if (value === undefined) {
              return '';
            }
            // Handle strings with commas by wrapping in quotes
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          })
          .join(',');
      });

      // Combine headers and rows
      const componentCsvContent = [componentHeaders, ...componentRows].join(
        '\n',
      );

      // Write to file
      await fs.writeFile(componentFilePath, componentCsvContent, 'utf8');

      results.push(`Component track data saved to ${componentFilename}`);
    }

    // Process Scheduler Track data
    if (Array.isArray(schedulerTrackData) && schedulerTrackData.length > 0) {
      const schedulerFilename = `react-scheduler-track-${timestamp}.csv`;
      const schedulerFilePath = path.join(artifactsDir, schedulerFilename);

      // Define headers for scheduler track
      const schedulerHeaders = [
        'name',
        'startTime',
        'endTime',
        'type',
        'track',
        'color',
      ].join(',');

      // Convert data to CSV rows
      const schedulerRows = schedulerTrackData.map(item => {
        return schedulerHeaders
          .split(',')
          .map(header => {
            const value = item[header];
            // Handle undefined values
            if (value === undefined) {
              return '';
            }
            // Handle strings with commas by wrapping in quotes
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          })
          .join(',');
      });

      // Combine headers and rows
      const schedulerCsvContent = [schedulerHeaders, ...schedulerRows].join(
        '\n',
      );

      // Write to file
      await fs.writeFile(schedulerFilePath, schedulerCsvContent, 'utf8');

      results.push(`Scheduler track data saved to ${schedulerFilename}`);
    }

    return results.length > 0
      ? `Performance data saved in the artifacts directory:\n${results.join('\n')}`
      : 'No performance data was available to save.';
  } catch (error) {
    throw new Error(`Failed to process performance data: ${error}`);
  }
}
