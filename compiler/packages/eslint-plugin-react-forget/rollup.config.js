import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import path from "path";
import process from "process";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: false,
  },
  plugins: [
    typescript({
      compilerOptions: {
        noEmit: true,
      },
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
      resolveOnly: ["@babel-plugin-react-forget"],
      rootDir: path.join(process.cwd(), ".."),
    }),
    commonjs(),
  ],
};
