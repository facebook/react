/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";

const JsFileExtensionRE = /(js|ts|jsx|tsx)$/;
const StrictModeRE = /(?<!\/\/[^\n]*)<(React\.StrictMode|StrictMode)>/;
const NextConfigFileRE = /^next\.config\.(js|mjs)$/;
const NextStrictModeRE = /(?<!\/\/[^\n]*)reactStrictMode\s*:\s*true/;
const NextNonStrictModeRE = /(?<!\/\/[^\n]*)reactStrictMode\s*:\s*false/;

let isNextAppRoute = false;
let nextStrictFlag: boolean | undefined = undefined;
let isStrictComponentUsed = false;

export default {
  run(source: string, path: string): void {
    if (
      (path.startsWith("src/app/") || path.startsWith("app/")) &&
      (path.endsWith("layout.tsx") || path.endsWith("layout.jsx"))
    ) {
      isNextAppRoute = true;
    }

    if (NextConfigFileRE.exec(path) !== null) {
      nextStrictFlag =
        NextStrictModeRE.exec(source) !== null
          ? true
          : NextNonStrictModeRE.exec(source) !== null
          ? false
          : undefined;
    } else if (
      JsFileExtensionRE.exec(path) !== null &&
      StrictModeRE.exec(source) !== null
    ) {
      isStrictComponentUsed = true;
    }
  },

  report(): void {
    if (
      (isNextAppRoute && nextStrictFlag === undefined) ||
      nextStrictFlag === true ||
      isStrictComponentUsed === true
    ) {
      console.log(chalk.green("StrictMode usage found."));
    } else {
      console.log(chalk.red("StrictMode usage not found."));
    }
  },
};
