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

async function processTrackData(
  trackData: any,
  headers: string[],
): Promise<boolean> {
  const artifactsDir = path.join(__dirname, '../src/artifacts');

  if (Array.isArray(trackData) && trackData.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const trackName = trackData[0].track;

    const componentFilename = `react-${trackName}-track-${timestamp}.csv`;
    const componentFilePath = path.join(artifactsDir, componentFilename);

    const componentRows = trackData.map(item => {
      return headers
        .map(header => {
          const value = item[header];
          if (value === undefined) {
            return '';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',');
    });

    const componentCsvContent = [headers, ...componentRows].join('\n');

    await fs.writeFile(componentFilePath, componentCsvContent, 'utf8');

    return true;
  }
  return false;
}

export async function getPerfData(url: string): Promise<string[]> {
  try {
    const page = await hookIntoPage(url);

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
      return [
        'No performance data was captured. Make sure to run start-react-performance-recording first.',
      ];
    }

    try {
      const artifactsDir = path.join(__dirname, '../src/artifacts');
      await fs.rm(artifactsDir, {recursive: true, force: true});
      await fs.mkdir(artifactsDir, {recursive: true});
    } catch (err) {
      console.error(`Error creating directory: ${err}`);
    }

    const result = [];

    if (
      await processTrackData(componentTrackData, [
        'name',
        'startTime',
        'endTime',
        'track',
        'color',
      ])
    ) {
      result.push(
        'Component track data saved in the artifacts directory it can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No component track data was available to save.');
    }

    if (
      await processTrackData(schedulerTrackData, [
        'name',
        'startTime',
        'endTime',
        'type',
        'track',
        'color',
      ])
    ) {
      result.push(
        'Scheduler track data saved in the artifacts directory it can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No scheduler track data was available to save.');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to process performance data: ${error}`);
  }
}

/**
 * Safely executes a JavaScript script that uses the data-frame library to analyze CSV files
 * in the artifacts directory.
 *
 * @param script The JavaScript script to execute
 * @param saveToMemory Optional array of dataframe names to save to memory
 * @returns A promise that resolves to the result of the script execution
 */
export async function executeDataFrameScript(
  script: string,
  saveToMemory?: string[],
): Promise<{output: string; dataFrames?: Record<string, any>}> {
  try {
    // Create a VM context to safely execute the script
    const vm = require('vm');
    const dataForge = require('data-forge');
    const fs = require('fs');
    const path = require('path');
    const artifactsDir = path.join(__dirname, '../src/artifacts');

    // Get all CSV files in the artifacts directory
    const files = await fs.promises.readdir(artifactsDir);
    const csvFiles = files.filter((file: string) => file.endsWith('.csv'));

    // Create a context with the necessary libraries and data
    const context: Record<string, any> = {
      dataForge,
      require,
      console,
      process,
      Buffer,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      csvFiles,
      artifactsDir,
      path,
      fs,
      data: {},
      notes: [],
    };

    // Load all CSV files into the context
    for (const file of csvFiles as string[]) {
      const filePath = path.join(artifactsDir, file);
      const dataFrame = dataForge.readFileSync(filePath).parseCSV();
      const dfName = file.replace(/\.csv$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      context['data'][dfName] = dataFrame;
    }

    // Capture console output
    const originalConsoleLog = console.log;
    const capturedOutput: string[] = [];

    console.log = (...args) => {
      capturedOutput.push(
        args
          .map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
          )
          .join(' '),
      );
      originalConsoleLog(...args);
    };

    // Execute the script in the VM context
    context['notes'].push(`Running script: \n${script}`);
    vm.createContext(context);
    vm.runInContext(script, context);

    // Restore console.log
    console.log = originalConsoleLog;

    // Prepare the result
    const stdOutScript = capturedOutput.join('\n');
    const output = stdOutScript || 'No output';
    context['notes'].push(`Result: ${output}`);

    const result: {output: string; dataFrames?: Record<string, any>} = {output};

    // Save dataframes to memory if requested
    if (saveToMemory && Array.isArray(saveToMemory)) {
      result.dataFrames = {};
      for (const dfName of saveToMemory) {
        if (context['data'][dfName]) {
          result.dataFrames[dfName] = context['data'][dfName];
          context['notes'].push(`Saving dataframe '${dfName}' to memory`);
        }
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Error running script: ${error}`);
  }
}
