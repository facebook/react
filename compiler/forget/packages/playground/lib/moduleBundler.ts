/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { rollup } from "rollup";
import forgetPlaygroundPlugin from "./forgetPlaygroundPlugin";
import type { Store } from "./stores";
import { minify } from "terser";
import invariant from "invariant";
import { gzip, strToU8 } from "fflate";
import prettyBytes from "pretty-bytes";
import { ForgetCompilerFlags } from "./compilerDriver";

let bundleId = 0;
const ROLLUP_ENTRY = "./_app.js";
export interface BundleResult {
  id: number;
  res:
    | undefined
    | {
        getCode(version: "before" | "after", cacheBreakId?: number): string;
        codeSizeDiff: {
          min: string;
          minPercent: number;
          gzip: string;
          gzipPercent: number;
        };
      };
}

export const defaultBundleRes = {
  id: 0,
  res: undefined,
  messages: [],
};

export async function bundle(
  files: Store["files"],
  compilerFlags: ForgetCompilerFlags,
  reactVersion = "18.2.0"
): Promise<BundleResult> {
  const codeAfter = await bundleWithRollup(
    files,
    true,
    reactVersion,
    compilerFlags
  );
  if (!codeAfter) return { id: bundleId, res: undefined };

  const codeBefore = await bundleWithRollup(
    files,
    false,
    reactVersion,
    compilerFlags
  );
  invariant(codeBefore, "codeBefore should be consistent with codeAfter.");

  const [minAfter, gzipAfter] = await compress(codeAfter);
  const [minBefore, gzipBefore] = await compress(codeBefore);
  return {
    id: bundleId++,
    res: {
      getCode(version: "before" | "after", cacheBreakId?: number): string {
        // Annotate with cache-busting bundleId and cacheBreakId to form unique moduleName.
        // @see https://twitter.com/Huxpro/status/1551017434462621696
        return `${
          version === "before" ? codeBefore : codeAfter
        } /* ${version} ${bundleId} ${cacheBreakId ?? ""} */`;
      },
      codeSizeDiff: {
        min: prettyBytes(minAfter - minBefore, { signed: true }),
        minPercent: getPercentage(minAfter, minBefore),
        gzip: prettyBytes(gzipAfter - gzipBefore, { signed: true }),
        gzipPercent: getPercentage(gzipAfter, gzipBefore),
      },
    },
  };
}

/**
 * Bundle @param files with Rollup.
 * @returns a tuple of bundled code (undefined when error) and messages.
 */
async function bundleWithRollup(
  files: Store["files"],
  enableForget: boolean,
  reactVersion: string,
  compilerFlags: ForgetCompilerFlags
): Promise<string | undefined> {
  try {
    const rollupBuild = await rollup({
      input: ROLLUP_ENTRY,
      plugins: [
        forgetPlaygroundPlugin({
          files,
          enableForget,
          reactVersion,
          compilerFlags,
        }),
      ],
    });

    const {
      output: [{ code }],
    } = await rollupBuild.generate({
      format: "esm",
    });

    return code;
  } catch (e) {
    return undefined;
  }
}
/**
 * Given @param code, @returns both minified and minified + gzipped code.
 */
async function compress(code: string): Promise<[number, number]> {
  const minified = (await minify(code)).code;
  invariant(minified, "Must have valid minified code.");
  const minifiedSize = new Blob([minified]).size;

  const gzipped = await execGzip(minified);
  const gzippedSize = new Blob([gzipped]).size;

  return [minifiedSize, gzippedSize];
}

/**
 * @returns the percentage of @param a in relation to @param b.
 */
function getPercentage(a: number, b: number): number {
  return ((a - b) / b) * 100;
}

function execGzip(code: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    gzip(strToU8(code), (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}
