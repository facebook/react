/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "fs/promises";
import glob from "glob";
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
  inputPath: string;
  inputExists: boolean;
  outputPath: string;
  outputExists: boolean;
};

export function getFixtures(
  filter: TestFilter | null
): Map<string, TestFixture> {
  // search for fixtures within nested directories
  const files = glob.sync(`**/*.{js,ts,tsx,md}`, {
    cwd: FIXTURES_PATH,
  });
  const fixtures: Map<string, TestFixture> = new Map();

  for (const filePath of files) {
    const basename = path.basename(
      path.basename(
        path.basename(path.basename(filePath, ".js"), ".ts"),
        ".tsx"
      ),
      ".expect.md"
    );
    // "partial" paths do not include suffixes
    const partialRelativePath = path.join(path.dirname(filePath), basename);
    // Replicate jest test behavior
    if (basename.startsWith("todo.")) {
      continue;
    }
    if (filter) {
      if (
        filter.kind === "only" &&
        filter.paths.indexOf(partialRelativePath) === -1
      ) {
        continue;
      } else if (
        filter.kind === "skip" &&
        filter.paths.indexOf(partialRelativePath) !== -1
      ) {
        continue;
      }
    }

    let fixtureInfo = fixtures.get(partialRelativePath);
    if (fixtureInfo === undefined) {
      const partialAbsolutePath = path.join(FIXTURES_PATH, partialRelativePath);
      fixtureInfo = {
        basename,
        inputPath: `${partialAbsolutePath}.js`,
        inputExists: false,
        outputPath: `${partialAbsolutePath}.expect.md`,
        outputExists: false,
      };
      fixtures.set(partialRelativePath, fixtureInfo);
    }

    if (
      filePath.endsWith(".js") ||
      filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx")
    ) {
      // inputPath may have a different file extension than the .js default
      fixtureInfo.inputPath = path.join(FIXTURES_PATH, filePath);
      fixtureInfo.inputExists = true;
    } else {
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
