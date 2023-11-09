/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "fs/promises";
import glob from "glob";
import invariant from "invariant";
import path from "path";
import { FILTER_PATH, FIXTURES_PATH } from "./constants";

const KIND_DEFAULT = "only";
export type TestFilter =
  | {
      kind: "only";
      debug: boolean;
      paths: Array<string>;
    }
  | {
      kind: "skip";
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

function shouldSkip(
  filter: TestFilter | null,
  filterId: string,
  filename: string
) {
  if (filter) {
    if (filter.kind === "only" && filter.paths.indexOf(filterId) === -1) {
      return true;
    } else if (
      filter.kind === "skip" &&
      filter.paths.indexOf(filterId) !== -1
    ) {
      return true;
    }
  } else if (filename.startsWith("todo.")) {
    return true;
  }
  return false;
}

export async function readTestFilter(): Promise<TestFilter | null> {
  if (!(await exists(FILTER_PATH))) {
    throw new Error(`testfilter file not found at ${FILTER_PATH}`);
  }

  const input = await fs.readFile(FILTER_PATH, "utf8");
  const lines = input.trim().split("\n");

  let filter: "only" | "skip" = KIND_DEFAULT;
  let debug: boolean = false;
  const line0 = lines[0];
  if (line0 != null) {
    // Try to parse pragmas
    let consumedLine0 = false;
    if (line0.indexOf("@only") !== -1) {
      filter = "only";
      consumedLine0 = true;
    } else if (line0.indexOf("@skip") !== -1) {
      filter = "skip";
      consumedLine0 = true;
    }
    if (line0.indexOf("@debug") !== -1) {
      debug = true;
      consumedLine0 = true;
    }

    if (consumedLine0) {
      lines.shift();
    }
  }
  return {
    kind: filter,
    debug,
    paths: lines,
  };
}

export type TestFixture = {
  basename: string;
  inputPath: string | null;
  outputPath: string;
  outputExists: boolean;
};

const INPUT_EXTENSIONS = [".js", ".ts", ".jsx", ".tsx"];
const OUTPUT_EXTENSION = ".expect.md";
export function getFixtures(
  filter: TestFilter | null
): Map<string, TestFixture> {
  // search for fixtures within nested directories
  const inputFiles = glob.sync(`**/*{${INPUT_EXTENSIONS.join(",")}}`, {
    cwd: FIXTURES_PATH,
  });
  const fixtures: Map<string, TestFixture> = new Map();
  for (const filePath of inputFiles) {
    const filename = path.basename(filePath);
    // Do not include extensions in unique identifier for fixture
    const partialPath = stripExtension(filePath, INPUT_EXTENSIONS);
    if (shouldSkip(filter, partialPath, filename)) {
      continue;
    }

    const fixtureInfo = fixtures.get(partialPath);
    if (fixtureInfo === undefined) {
      fixtures.set(partialPath, {
        basename: path.basename(partialPath),
        inputPath: path.join(FIXTURES_PATH, filePath),
        outputPath: path.join(FIXTURES_PATH, partialPath) + OUTPUT_EXTENSION,
        outputExists: false,
      });
    } else {
      console.warn(
        "Found duplicate fixture files: ",
        fixtureInfo.inputPath,
        filePath
      );
    }
  }

  const outputFiles = glob.sync(`**/*${OUTPUT_EXTENSION}`, {
    cwd: FIXTURES_PATH,
  });
  for (const filePath of outputFiles) {
    const filename = path.basename(filePath);
    // Do not include extensions in unique identifier for fixture
    const partialPath = stripExtension(filePath, [OUTPUT_EXTENSION]);
    if (shouldSkip(filter, partialPath, filename)) {
      continue;
    }

    const fixtureInfo = fixtures.get(partialPath);
    if (fixtureInfo === undefined) {
      fixtures.set(partialPath, {
        basename: path.basename(partialPath),
        inputPath: null,
        outputPath: path.join(FIXTURES_PATH, filePath),
        outputExists: true,
      });
    } else {
      invariant(
        fixtureInfo.outputPath === path.join(FIXTURES_PATH, filePath),
        "Unexpected output filepath"
      );
      fixtureInfo.outputExists = true;
    }
  }

  return fixtures;
}

function wrapWithTripleBackticks(s: string, ext: string | null = null): string {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

export function writeOutputToString(
  input: string,
  output: string | null,
  error: Error | null
) {
  // leading newline intentional
  let result = `
## Input

${wrapWithTripleBackticks(input, "javascript")}
`; // trailing newline + space internional

  if (output != null) {
    result += `
## Code

${output == null ? "[ none ]" : wrapWithTripleBackticks(output, "javascript")}
`;
  } else {
    result += "\n";
  }

  if (error != null) {
    const errorMessage = error.message.replace(/^\/.*?:\s/, "");

    result += `
## Error

${wrapWithTripleBackticks(errorMessage)}
          \n`;
  }
  return result + `      `;
}
