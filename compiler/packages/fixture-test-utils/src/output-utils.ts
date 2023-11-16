/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";
import fs from "fs";
import invariant from "invariant";
import { diff } from "jest-diff";
import path from "path";

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

export type TestResult = {
  actual: string | null; // null == input did not exist
  expected: string | null; // null == output did not exist
  outputPath: string;
  unexpectedError: string | null;
};
export type TestResults = Map<string, TestResult>;
export enum UpdateSnapshotKind {
  Snap,
  Sprout,
}
const SPROUT_SEPARATOR = "\n### Eval output\n";
export function getUpdatedSnapshot(
  currentSnapshot: string | null,
  data: string,
  kind: UpdateSnapshotKind
): string {
  let currentData = currentSnapshot?.split(SPROUT_SEPARATOR) ?? [];
  invariant(
    currentData.length <= 2,
    "Found duplicate sprout snapshots in fixture!"
  );
  if (kind === UpdateSnapshotKind.Snap) {
    const sproutData = currentData[1] ?? null;
    const sproutSnapshot =
      sproutData != null ? SPROUT_SEPARATOR + sproutData : "";
    return data + sproutSnapshot;
  } else {
    const snapSnapshot = currentData[0] ?? "";
    return snapSnapshot + SPROUT_SEPARATOR + data;
  }
}
/**
 * Update the fixtures directory given the compilation results
 */
export async function update(results: TestResults): Promise<void> {
  let deleted = 0;
  let updated = 0;
  let created = 0;
  const failed = [];
  for (const [basename, result] of results) {
    if (result.unexpectedError != null) {
      console.log(
        chalk.red.inverse.bold(" FAILED ") + " " + chalk.dim(basename)
      );
      failed.push([basename, result.unexpectedError]);
    } else if (result.actual == null) {
      // Input was deleted but the expect file still existed, remove it
      console.log(
        chalk.red.inverse.bold(" REMOVE ") + " " + chalk.dim(basename)
      );
      try {
        fs.unlinkSync(result.outputPath);
        console.log(" remove  " + result.outputPath);
        deleted++;
      } catch (e) {
        console.error(
          "[Snap tester error]: failed to remove " + result.outputPath
        );
        failed.push([basename, result.unexpectedError]);
      }
    } else if (result.actual !== result.expected) {
      // Expected output has changed
      console.log(
        chalk.blue.inverse.bold(" UPDATE ") + " " + chalk.dim(basename)
      );
      try {
        fs.writeFileSync(result.outputPath, result.actual, "utf8");
      } catch (e) {
        if (e?.code === "ENOENT") {
          // May have failed to create nested dir, so make a directory and retry
          fs.mkdirSync(path.dirname(result.outputPath), { recursive: true });
          fs.writeFileSync(result.outputPath, result.actual, "utf8");
        }
      }
      if (result.expected == null) {
        created++;
      } else {
        updated++;
      }
    } else {
      // Expected output is current
      console.log(
        chalk.green.inverse.bold("  OKAY  ") + " " + chalk.dim(basename)
      );
    }
  }
  console.log(
    `${deleted} Deleted, ${created} Created, ${updated} Updated, ${failed.length} Failed`
  );
  for (const [basename, errorMsg] of failed) {
    console.log(`${chalk.red.bold("Fail:")} ${basename}\n${errorMsg}`);
  }
}

/**
 * Report test results to the user
 * @returns boolean indicatig whether all tests passed
 */
export function report(results: TestResults): boolean {
  const failures: Array<[string, TestResult]> = [];
  for (const [basename, result] of results) {
    if (result.actual === result.expected && result.unexpectedError == null) {
      console.log(
        chalk.green.inverse.bold(" PASS ") + " " + chalk.dim(basename)
      );
    } else {
      console.log(chalk.red.inverse.bold(" FAIL ") + " " + chalk.dim(basename));
      failures.push([basename, result]);
    }
  }

  if (failures.length !== 0) {
    console.log("\n" + chalk.red.bold("Failures:") + "\n");

    for (const [basename, result] of failures) {
      console.log(chalk.red.bold("FAIL:") + " " + basename);
      if (result.unexpectedError != null) {
        console.log(
          ` >> Unexpected error during test: \n${result.unexpectedError}`
        );
      } else {
        if (result.expected == null) {
          invariant(result.actual != null, "[Tester] Internal failure.");
          console.log(
            chalk.red("[ expected fixture output is absent ]") + "\n"
          );
        } else if (result.actual == null) {
          invariant(result.expected != null, "[Tester] Internal failure.");
          console.log(
            chalk.red(`[ fixture input for ${result.outputPath} is absent ]`) +
              "\n"
          );
        } else {
          console.log(diff(result.expected, result.actual) + "\n");
        }
      }
    }
  }

  console.log(
    `${results.size} Tests, ${results.size - failures.length} Passed, ${
      failures.length
    } Failed`
  );
  return failures.length === 0;
}
