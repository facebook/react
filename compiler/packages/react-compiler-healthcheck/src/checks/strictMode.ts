/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";

const JsFileExtensionRE = /(js|ts|jsx|tsx)$/;
const StrictModeRE = /\<StrictMode\>/;
let StrictModeUsage = false;

export default {
  run(source: string, path: string): void {
    if (JsFileExtensionRE.exec(path) === null) {
      return;
    }

    if (!StrictModeUsage) {
      StrictModeUsage = StrictModeRE.exec(source) !== null;
    }
  },

  report(): void {
    if (StrictModeUsage) {
      console.log(chalk.green("StrictMode usage found."));
    } else {
      console.log(chalk.red("StrictMode usage not found."));
    }
  },
};
