/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

/*
 * Based on similar script in React
 * https://github.com/facebook/react/blob/main/scripts/prettier/index.js
 */

const chalk = require("chalk");
const glob = require("glob");
const prettier = require("prettier");
const fs = require("fs");
const listChangedFiles = require("./shared/list-changed-files");
const prettierConfigPath = require.resolve("../.prettierrc");

const mode = process.argv[2] || "check";
const shouldWrite = mode === "write" || mode === "write-changed";
const onlyChanged = mode === "check-changed" || mode === "write-changed";

const changedFiles = onlyChanged ? listChangedFiles() : null;
let didWarn = false;
let didError = false;

const files = glob
  .sync("**/*.{js,ts,tsx,jsx}", {
    ignore: [
      "**/node_modules/**",
      "packages/demo-2021Q3/**",
      "packages/demo-todolist-live/**",
      "packages/demo-todolist-next/**",
      "packages/demo-todolist-playground/**",
      "packages/eslint-browser/**",
      "**/__tests__/fixtures/**/*.flow.js",
    ],
  })
  .filter((f) => !onlyChanged || changedFiles.has(f));
if (!files.length) {
  return;
}

files.forEach((file) => {
  const options = prettier.resolveConfig.sync(file, {
    config: prettierConfigPath,
  });
  try {
    const input = fs.readFileSync(file, "utf8");
    if (shouldWrite) {
      const output = prettier.format(input, options);
      if (output !== input) {
        fs.writeFileSync(file, output, "utf8");
      }
    } else {
      if (!prettier.check(input, options)) {
        if (!didWarn) {
          console.log(
            "\n" +
              chalk.red(
                `  This project uses prettier to format all JavaScript code.\n`
              ) +
              chalk.dim(`    Please run `) +
              chalk.reset("yarn prettier:all") +
              chalk.dim(
                ` and add changes to files listed below to your commit:`
              ) +
              `\n\n`
          );
          didWarn = true;
        }
        console.log(file);
      }
    }
  } catch (error) {
    didError = true;
    console.log("\n\n" + error.message);
    console.log(file);
  }
});

if (didWarn || didError) {
  process.exitCode = 1;
}
