/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

/* global expect,test */

import fs from "fs";
import path from "path";
import { GatingOptions, PluginOptions } from "../../Babel/PluginOptions";

const EXPECT_SUFFIX = ".expect.md";

const PROJECT_ROOT = path.dirname(path.dirname(__dirname));

expect.extend({
  accessSnapshotState(_anything, cb) {
    cb(this["snapshotState"]._updateSnapshot);
    return {
      pass: true,
      message: () => "",
    };
  },
  toHaveNoUnmatchedSnapshots(unmatchedSnapshots, fixturesPath) {
    return {
      pass: unmatchedSnapshots.length === 0,
      message: () => {
        const unmatchedSnapshotsText = unmatchedSnapshots
          .map((file: string) => path.join(fixturesPath, file))
          .join("\n * ");
        return (
          `Found ${EXPECT_SUFFIX} files without corresponding inputs:\n* ${unmatchedSnapshotsText}` +
          `\n\nRun 'npm test -- -u' to remove these extra ${EXPECT_SUFFIX} files`
        );
      },
    };
  },
});

type FixtureTestOptions = {
  debug: boolean;
  language: "flow" | "typescript";
};
export default function generateTestsFromFixtures(
  fixturesPath: string,
  transform: (
    input: string,
    file: any,
    options: FixtureTestOptions & PluginOptions
  ) => string
) {
  let files: Array<string>;
  try {
    files = fs.readdirSync(fixturesPath);
  } catch (e) {
    if (e.code === "ENOENT") {
      files = [];
    } else {
      throw e;
    }
  }
  const fixtures = matchInputOutputFixtures(files, fixturesPath);

  const relativeFixturesPath = path.relative(PROJECT_ROOT, fixturesPath);
  describe(relativeFixturesPath, () => {
    test("has a consistent extension for input fixtures", () => {
      const extensions = Array.from(
        new Set(
          Array.from(fixtures.values())
            .map((entry) =>
              entry.input != null ? path.extname(entry.input) : null
            )
            .filter(Boolean)
        )
      );
      expect(extensions).toEqual(extensions.slice(0, 1));
    });

    describe("fixtures", () => {
      for (const {
        basename,
        input: inputFile,
        output: outputFile,
      } of Array.from(fixtures.values())) {
        let testCommand = test;
        let input: string | null = null;
        let debug = false;
        let enableOnlyOnUseForgetDirective = false;
        let gating: GatingOptions | null = null;
        let panicOnBailout = true;

        if (inputFile != null) {
          input = fs.readFileSync(inputFile, "utf8");
          const lines = input.split("\n");
          if (lines[0]!.indexOf("@only") !== -1) {
            testCommand = test.only;
          }
          if (lines[0]!.indexOf("@skip") !== -1) {
            testCommand = test.skip;
          }
          if (lines[0]!.indexOf("@debug") !== -1) {
            debug = true;
          }
          if (lines[0]!.indexOf("@forgetDirective") !== -1) {
            enableOnlyOnUseForgetDirective = true;
          }
          if (lines[0]!.indexOf("@gating") !== -1) {
            gating = {
              source: "ReactForgetFeatureFlag",
              importSpecifierName: "isForgetEnabled_Fixtures",
            };
          }
          if (lines[0]!.indexOf("@panicOnBailout false") !== -1) {
            panicOnBailout = false;
          }
        }

        testCommand(basename, () => {
          let receivedOutput;
          if (input !== null) {
            receivedOutput = transform(input, basename, {
              environment: {},
              logger: null,
              debug,
              enableOnlyOnUseForgetDirective,
              gating,
              language: parseLanguage(input),
              panicOnBailout,
            });
          } else {
            receivedOutput = "<<input deleted>>";
          }

          // Use a standard snapshot for the expected output so that the snapshot fails unless the
          // value matches
          expect(receivedOutput).toMatchSnapshot();

          // Determine whether the snapshot is in update mode or only creating snapshots for new inputs
          // to update the .expect file in parallel with updating the snapshot itself.
          const snapshotUpdateMode = determineSnapshotMode();
          if (outputFile != null) {
            const outputExists = fs.existsSync(outputFile);
            if (
              snapshotUpdateMode === "all" ||
              (snapshotUpdateMode === "new" && !outputExists)
            ) {
              if (inputFile != null) {
                fs.writeFileSync(outputFile, receivedOutput, "utf8");
              } else {
                fs.unlinkSync(outputFile);
              }
            } else {
              // As a sanity check, make sure that the current output matches the .expect file
              const actualOutput = fs.readFileSync(outputFile, "utf8");
              expect(receivedOutput).toEqual(actualOutput);
            }
          }
        });
      }
    });
  });
}

const FlowPragmas = [/\/\/\s@flow$/gm, /\*\s@flow$/gm];
function parseLanguage(source: string): "flow" | "typescript" {
  let useFlow: boolean = false;
  for (const flowPragma of FlowPragmas) {
    useFlow ||= !!source.match(flowPragma);
  }
  return useFlow ? "flow" : "typescript";
}

function determineSnapshotMode() {
  // Determine which snapshot mode we're in: ignoring snapshots,
  // updating new files only, or updating all files
  let updateSnapshots = "none";
  // @ts-ignore
  expect(null).accessSnapshotState((_updateSnapshots) => {
    updateSnapshots = _updateSnapshots;
  });
  const updateSnapshotEnvVariable = process.env["UPDATE_SNAPSHOTS"];
  if (
    updateSnapshotEnvVariable === "1" ||
    updateSnapshotEnvVariable === "all"
  ) {
    console.log(
      "Updating all snapshots due to UPDATE_SNAPSHOTS environment variable being set"
    );
    updateSnapshots = "all";
  } else {
    // @ts-ignore
    expect(updateSnapshotEnvVariable).toEqual();
  }
  expect(updateSnapshots).toEqual(expect.stringMatching(/none|new|all/));
  return updateSnapshots;
}

function matchInputOutputFixtures(files: string[], fixturesPath: string) {
  const fixtures: Map<
    string,
    { basename: string; input: string | null; output: string | null }
  > = new Map();
  for (const file of files) {
    const isOutput = file.endsWith(EXPECT_SUFFIX);
    const basename = path.basename(
      file,
      isOutput ? EXPECT_SUFFIX : path.extname(file)
    );
    let entry = fixtures.get(basename);
    if (entry === undefined) {
      entry = { basename, input: null, output: null };
      fixtures.set(basename, entry);
    }
    const resolvedPath = path.format({
      dir: fixturesPath,
      name: file,
    });
    if (isOutput) {
      entry.output = resolvedPath;
    } else {
      if (entry.input !== null) {
        throw new Error(
          "Found multiple inputs with the basename '" +
            basename +
            "': " +
            entry.input +
            " and " +
            resolvedPath
        );
      }
      entry.input = resolvedPath;
      const outputFile = path.format({
        dir: fixturesPath,
        name: basename,
        ext: EXPECT_SUFFIX,
      });
      entry.output = outputFile;
    }
  }
  return fixtures;
}
