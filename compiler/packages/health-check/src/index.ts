/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import yargs from "yargs/yargs";

function main() {
  const argv = yargs(process.argv.slice(2))
    .scriptName("healthcheck")
    .usage("$ npx healthcheck <src>")
    .option("src", {
      description: "glob expression matching src files to compile",
      type: "string",
      default: "**/*.{js,ts,jsx,tsx,mjs}",
    })
    .parseSync();

  console.log(argv.src);
}

main();
