/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import path from "path";
import process from "process";

const NO_INLINE = new Set(["@babel/types"]);

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: false,
    exports: "named",
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        noEmit: true,
      },
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
      resolveOnly: (module) => NO_INLINE.has(module) === false,
      rootDir: path.join(process.cwd(), ".."),
    }),
    commonjs(),
  ],
};
