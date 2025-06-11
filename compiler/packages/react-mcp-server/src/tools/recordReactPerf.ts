import {hookIntoPage} from '../utils/puppeteerUtils';
import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import type {Database as DatabaseType} from 'better-sqlite3';

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

/**
 * Processes track data and loads it directly into the database
 *
 * @param trackData The track data to process
 * @param headers The headers for the track data
 * @param tableName The name of the table to create
 * @returns A promise that resolves to true if the data was processed successfully, false otherwise
 */
async function processTrackData(
  trackData: any[],
  headers: string[],
  tableName: string,
): Promise<boolean> {
  if (!Array.isArray(trackData) || trackData.length === 0) {
    return false;
  }

  const db = getSQLiteDB();

  db.exec(`DROP TABLE IF EXISTS ${tableName}`);

  const createTableSQL = `CREATE TABLE ${tableName} (
    ${headers.map(header => `${header.trim()} TEXT`).join(', ')}
  )`;
  db.exec(createTableSQL);

  const placeholders = headers.map(() => '?').join(', ');
  const insertSQL = `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${placeholders})`;
  const insertStmt = db.prepare(insertSQL);

  const transaction = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertStmt.run(...row);
    }
  });

  const dataRows = trackData.map(item => {
    return headers.map(header => {
      const value = item[header];
      return value === undefined ? null : value;
    });
  });

  transaction(dataRows);

  return true;
}

let db: DatabaseType | null = null;

function getSQLiteDB(): DatabaseType {
  if (!db) {
    const dbPath = path.join(__dirname, '../src/artifacts/perf_data.db');
    db = new Database(dbPath);

    db.pragma('foreign_keys = ON');
  }
  return db;
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
      await fs.mkdir(artifactsDir, {recursive: true});
    } catch (err) {
      throw Error(`Error creating directory: ${err}`);
    }

    const result = [];

    const componentSuccess = await processTrackData(
      componentTrackData,
      ['name', 'startTime', 'endTime', 'track', 'color'],
      'component_track',
    );

    if (componentSuccess) {
      result.push(
        'Component track data loaded into the database and can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No component track data was available to save.');
    }

    const schedulerSuccess = await processTrackData(
      schedulerTrackData,
      ['name', 'startTime', 'endTime', 'type', 'track', 'color'],
      'scheduler_track',
    );

    if (schedulerSuccess) {
      result.push(
        'Scheduler track data loaded into the database and can now be accessed through the interpret-perf-data tool.',
      );
    } else {
      result.push('No scheduler track data was available to save.');
    }

    if (componentSuccess || schedulerSuccess) {
      result.push('SQLite database created and data loaded successfully.');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to process performance data: ${error}`);
  }
}

/**
 * Executes a SQL query against the SQLite database containing performance data.
 *
 * @param query The SQL query to execute
 * @returns A promise that resolves to the result of the query execution
 */
export async function interpretData(query: string): Promise<string> {
  try {
    const db = getSQLiteDB();

    const tablesExist =
      db
        .prepare(
          `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN ('component_track', 'scheduler_track')
    `,
        )
        .all().length > 0;

    if (!tablesExist) {
      return `No performance data tables found. Please run the process-react-performance-data tool first to capture and load performance data.

Example workflow:
1. Run 'start-react-performance-recording' to begin capturing data
2. Interact with your React application to generate performance data
3. Run 'process-react-performance-data' to process and load the data into SQLite
4. Then run SQL queries using this tool`;
    }

    let result: any;
    try {
      result = db.prepare(query).all();
    } catch (err) {
      db.exec(query);
      return 'Query executed successfully.';
    }

    if (Array.isArray(result)) {
      if (result.length === 0) {
        return 'Query executed successfully, but returned no results.';
      }

      const headers = Object.keys(result[0]);
      const rows = result.map(row =>
        headers.map(h => JSON.stringify(row[h])).join(','),
      );

      return [headers.join(','), ...rows].join('\n');
    } else {
      return JSON.stringify(result, null, 2);
    }
  } catch (error) {
    throw new Error(`Error running SQL query: ${error.message}`);
  }
}
