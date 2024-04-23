/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { glob } from "fast-glob";
import yargs from "yargs/yargs";

async function main() {
  const argv = yargs(process.argv.slice(2))
    .scriptName("healthcheck")
    .usage("$ npx healthcheck <src>")
    .option("src", {
      description: "glob expression matching src files to compile",
      type: "string",
      default: "**/*.{js,ts,jsx,tsx,mjs}",
    })
    .parseSync();

  let src = argv.src;

  // no file extension specified
  if (!src.includes(".")) {
    src = src + ".{js,ts,jsx,tsx,mjs}";
  }

  const globOptions = {
    onlyFiles: true,
    ignore: [
      "*/node_modules/**",
      "*/dist/**",
      "*/tests/**",
      "*/__tests__/**",
      "node_modules/**",
      "dist/**",
      "tests/**",
      "__tests__/**",
    ],
  };

  for (const path of await glob(src, globOptions)) {
    console.log(path);
  }
}

main();
