import {hookIntoPage} from '../utils/puppeteerUtils';
import fs from 'fs/promises';
import path from 'path';
import * as duckdb from 'duckdb';

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
        // Filter out 0 endTimes, this is used in devtools to hide duplicated render blocks but is noise for us
        if ((window as any).__MCP_RECORDING_ACTIVE__ && args[2] !== 0) {
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
              color: args[5],
            };
            (window as any).__COMPONENT_TRACK_TIMESTAMP_DATA__.push(
              timeStampData,
            );
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
): Promise<string | null> {
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

    return componentFilePath;
  }
  return null;
}

// Create a singleton DuckDB connection
let db: duckdb.Database | null = null;
let conn: duckdb.Connection | null = null;

function getDuckDB(): { db: duckdb.Database, conn: duckdb.Connection } {
  if (!db) {
    const dbPath = path.join(__dirname, '../src/artifacts/perf_data.db');
    db = new duckdb.Database(dbPath);
    conn = db.connect();
  }
  return { db, conn: conn! };
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

    const artifactsDir = path.join(__dirname, '../src/artifacts');

    try {
      await fs.rm(artifactsDir, {recursive: true, force: true});
      await fs.mkdir(artifactsDir, {recursive: true});
    } catch (err) {
      console.error(`Error creating directory: ${err}`);
    }

    const result = [];
    const csvFiles = [];

    const componentCsvPath = await processTrackData(componentTrackData, [
      'name',
      'startTime',
      'endTime',
      'track',
      'color',
    ]);

    if (componentCsvPath) {
      csvFiles.push({
        path: componentCsvPath,
        tableName: 'component_track',
      });
      result.push(
        'Component track data saved in the artifacts directory it can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No component track data was available to save.');
    }

    const schedulerCsvPath = await processTrackData(schedulerTrackData, [
      'name',
      'startTime',
      'endTime',
      'type',
      'track',
      'color',
    ]);

    if (schedulerCsvPath) {
      csvFiles.push({
        path: schedulerCsvPath,
        tableName: 'scheduler_track',
      });
      result.push(
        'Scheduler track data saved in the artifacts directory it can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No scheduler track data was available to save.');
    }

    // Initialize DuckDB and load CSV files
    const { conn } = getDuckDB();

    // Create tables and load data from CSV files
    for (const csvFile of csvFiles) {
      // Create table based on CSV structure
      conn.exec(`DROP TABLE IF EXISTS ${csvFile.tableName}`);
      conn.exec(`CREATE TABLE ${csvFile.tableName} AS SELECT * FROM read_csv_auto('${csvFile.path}')`);
    }

    result.push('DuckDB database created and data loaded successfully.');

    return result;
  } catch (error) {
    throw new Error(`Failed to process performance data: ${error}`);
  }
}

/**
 * Executes a SQL query against the DuckDB database containing performance data.
 *
 * @param query The SQL query to execute
 * @returns A promise that resolves to the result of the query execution
 */
export async function executeDataFrameScript(query: string): Promise<string> {
  try {
    const { conn } = getDuckDB();

    // Check if tables exist by querying the information schema
    const tablesExist = await new Promise<boolean>((resolve) => {
      conn.all(
        `SELECT table_name FROM information_schema.tables
         WHERE table_name IN ('component_track', 'scheduler_track')`,
        (err: Error | null, result: any[]) => {
          if (err || !result || result.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });

    if (!tablesExist) {
      return `No performance data tables found. Please run the process-react-performance-data tool first to capture and load performance data.

Example workflow:
1. Run 'start-react-performance-recording' to begin capturing data
2. Interact with your React application to generate performance data
3. Run 'process-react-performance-data' to process and load the data into DuckDB
4. Then run SQL queries using this tool`;
    }

    const result = await new Promise<any>((resolve, reject) => {
      conn.all(query, (err: Error | null, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (Array.isArray(result)) {
      if (result.length === 0) {
        return 'Query executed successfully, but returned no results.';
      }

      const headers = Object.keys(result[0]);
      const rows = result.map(row => headers.map(h => JSON.stringify(row[h])).join(','));

      return [headers.join(','), ...rows].join('\n');
    } else {
      return JSON.stringify(result, null, 2);
    }
  } catch (error) {
    throw new Error(`Error running SQL query: ${error.message}`);
  }
}
