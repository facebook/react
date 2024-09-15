/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs/promises';
import * as glob from 'glob';
import path from 'path';
import {FILTER_PATH, FIXTURES_PATH, SNAPSHOT_EXTENSION} from './constants';

const INPUT_EXTENSIONS = [
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.cts',
  '.mts',
  '.jsx',
  '.tsx',
];

export type TestFilter = {
  debug: boolean;
  paths: Array<string>;
};

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function stripExtension(filename: string, extensions: Array<string>): string {
  for (const ext of extensions) {
    if (filename.endsWith(ext)) {
      return filename.slice(0, -ext.length);
    }
  }
  return filename;
}

export async function readTestFilter(): Promise<TestFilter | null> {
  if (!(await exists(FILTER_PATH))) {
    throw new Error(`testfilter file not found at \`${FILTER_PATH}\``);
  }

  const input = await fs.readFile(FILTER_PATH, 'utf8');
  const lines = input.trim().split('\n');

  let debug: boolean = false;
  const line0 = lines[0];
  if (line0 != null) {
    // Try to parse pragmas
    let consumedLine0 = false;
    if (line0.indexOf('@only') !== -1) {
      consumedLine0 = true;
    }
    if (line0.indexOf('@debug') !== -1) {
      debug = true;
      consumedLine0 = true;
    }

    if (consumedLine0) {
      lines.shift();
    }
  }
  return {
    debug,
    paths: lines.filter(line => !line.trimStart().startsWith('//')),
  };
}

export function getBasename(fixture: TestFixture): string {
  return stripExtension(path.basename(fixture.inputPath), INPUT_EXTENSIONS);
}
export function isExpectError(fixture: TestFixture | string): boolean {
  const basename = typeof fixture === 'string' ? fixture : getBasename(fixture);
  return basename.startsWith('error.') || basename.startsWith('todo.error');
}

export type TestFixture =
  | {
      fixturePath: string;
      input: string | null;
      inputPath: string;
      snapshot: string | null;
      snapshotPath: string;
    }
  | {
      fixturePath: string;
      input: null;
      inputPath: string;
      snapshot: string;
      snapshotPath: string;
    };

async function readInputFixtures(
  rootDir: string,
  filter: TestFilter | null,
): Promise<Map<string, {value: string; filepath: string}>> {
  let inputFiles: Array<string>;
  if (filter == null) {
    inputFiles = glob.sync(`**/*{${INPUT_EXTENSIONS.join(',')}}`, {
      cwd: rootDir,
    });
  } else {
    inputFiles = (
      await Promise.all(
        filter.paths.map(pattern =>
          glob.glob(`${pattern}{${INPUT_EXTENSIONS.join(',')}}`, {
            cwd: rootDir,
          }),
        ),
      )
    ).flat();
  }
  const inputs: Array<Promise<[string, {value: string; filepath: string}]>> =
    [];
  for (const filePath of inputFiles) {
    // Do not include extensions in unique identifier for fixture
    const partialPath = stripExtension(filePath, INPUT_EXTENSIONS);
    inputs.push(
      fs.readFile(path.join(rootDir, filePath), 'utf8').then(input => {
        return [
          partialPath,
          {
            value: input,
            filepath: filePath,
          },
        ];
      }),
    );
  }
  return new Map(await Promise.all(inputs));
}
async function readOutputFixtures(
  rootDir: string,
  filter: TestFilter | null,
): Promise<Map<string, string>> {
  let outputFiles: Array<string>;
  if (filter == null) {
    outputFiles = glob.sync(`**/*${SNAPSHOT_EXTENSION}`, {
      cwd: rootDir,
    });
  } else {
    outputFiles = (
      await Promise.all(
        filter.paths.map(pattern =>
          glob.glob(`${pattern}${SNAPSHOT_EXTENSION}`, {
            cwd: rootDir,
          }),
        ),
      )
    ).flat();
  }
  const outputs: Array<Promise<[string, string]>> = [];
  for (const filePath of outputFiles) {
    // Do not include extensions in unique identifier for fixture
    const partialPath = stripExtension(filePath, [SNAPSHOT_EXTENSION]);

    const outputPath = path.join(rootDir, filePath);
    const output: Promise<[string, string]> = fs
      .readFile(outputPath, 'utf8')
      .then(output => {
        return [partialPath, output];
      });
    outputs.push(output);
  }
  return new Map(await Promise.all(outputs));
}

export async function getFixtures(
  filter: TestFilter | null,
): Promise<Map<string, TestFixture>> {
  const inputs = await readInputFixtures(FIXTURES_PATH, filter);
  const outputs = await readOutputFixtures(FIXTURES_PATH, filter);

  const fixtures: Map<string, TestFixture> = new Map();
  for (const [partialPath, {value, filepath}] of inputs) {
    const output = outputs.get(partialPath) ?? null;
    fixtures.set(partialPath, {
      fixturePath: partialPath,
      input: value,
      inputPath: filepath,
      snapshot: output,
      snapshotPath: path.join(FIXTURES_PATH, partialPath) + SNAPSHOT_EXTENSION,
    });
  }

  for (const [partialPath, output] of outputs) {
    if (!fixtures.has(partialPath)) {
      fixtures.set(partialPath, {
        fixturePath: partialPath,
        input: null,
        inputPath: 'none',
        snapshot: output,
        snapshotPath:
          path.join(FIXTURES_PATH, partialPath) + SNAPSHOT_EXTENSION,
      });
    }
  }
  return fixtures;
}
