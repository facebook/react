/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { TransformOptions } from "@babel/core";
import { transform } from "@babel/standalone";
import invariant from "invariant";
import type { Plugin } from "rollup";
import { ForgetCompilerFlags } from "./compilerDriver";
import patchUseMemoCache from "./patchUseMemoCache";
import { FileExt, matchFileId, type InputFile } from "./stores";
import { getBabelPlugins } from "./utils";

const MODULE_PREFIX = "\0";
const CDN = "https://esm.sh";

/**
 * Rollup plugin that interprets input tabs as a virtual file system
 * and monkeypatches `useMemoCache` into `react`.
 */
export default function forgetPlaygroundPlugin({
  files,
  enableForget,
  reactVersion,
  compilerFlags,
}: {
  files: InputFile[];
  enableForget: boolean;
  reactVersion: string;
  compilerFlags: ForgetCompilerFlags;
}): Plugin {
  const fileTable = new Map<string, InputFile>();
  files.forEach((f) => fileTable.set(`./${f.id}`, f));

  return {
    name: "forget-playground-plugin",
    resolveId(source) {
      /*
        Instruct Rollup to resolve `react` and `react-dom` as internal modules,
        where we'll then define their module content in the load hook below.

        Note that setting the `syntheticNamedExports` option to `true` allows
        Rollup to fall back missing named exports to the properties of the default
        export. This is so that we don't have to export properties of `react` by
        name (e.g., export { useState } from "react"). Instead we only export default
        from `react` and the subsequent uses of otherwise named exports will be
        transformed into the form of `React.useState`.

        Refer to https://github.com/rollup/rollup/pull/3295 for details on
        `syntheticNamedExports`.
      */
      if (source === "react" || source.startsWith("react/")) {
        return {
          // Prefix each internal module ID with `\0` to prevent other plugins
          // from trying to process it. (https://rollupjs.org/guide/en/#conventions)
          id: `${MODULE_PREFIX}${source}`,
          syntheticNamedExports: true,
        };
      }

      if (source.startsWith("react-dom")) {
        return {
          id: `${MODULE_PREFIX}${source}`,
          syntheticNamedExports: true,
        };
      }

      // User-defined CSS
      if (source.startsWith(".") && source.endsWith(".css")) {
        return `${MODULE_PREFIX}${source}`;
      }

      // Playground input tabs
      // Signals Rollup to not try to find the id elsewhere
      if (source.startsWith(".")) {
        const match = matchFileId(source);

        const hasExtension = match !== null;
        const isValidImportPath =
          hasExtension && (match[1] === "js" || match[1] === "jsx");

        // ES Module imports only allow extensions to be .js/.jsx (can be optionally
        // omitted). For .ts/.tsx files, the extension must be omitted. So, whenever
        // an file doesn't have an extension or has one that's not .js/.jsx, we try
        // to add one and see if the resulting ID exists in the input files.
        if (!isValidImportPath) {
          for (const ext of Object.keys(FileExt)) {
            if (ext === "css") continue;
            if (fileTable.has(`${source}.${ext}`)) {
              return `${MODULE_PREFIX}${source}.${ext}`;
            }
          }

          this.error("Bundling failed: invalid import path.");
        }

        return `${MODULE_PREFIX}${source}`;
      }

      // External URL
      if (source.includes("://")) {
        return {
          id: source,
          external: true,
        };
      }

      // Fallback to NPM packages
      return {
        id: `${CDN}/${source}`,
        external: true,
      };
    },
    load(id) {
      if (!id.startsWith(MODULE_PREFIX)) return null;

      id = id.slice(MODULE_PREFIX.length);

      if (id === "react") {
        return patchUseMemoCache(dev(`${CDN}/react@${reactVersion}`));
      }
      // `react/jsx-runtime`, etc.
      else if (id.startsWith("react/")) {
        const URL = id.replace("react", `${CDN}/react@${reactVersion}`);

        return `export { default } from "${dev(URL)}"`;
      }
      // `react-dom/client`, etc.
      else if (id.startsWith("react-dom")) {
        const URL = id.replace("react-dom", `${CDN}/react-dom@${reactVersion}`);

        return `export { default } from "${dev(URL)}"`;
      }

      // Load input tab content.
      const file = fileTable.get(id);
      invariant(
        file,
        "All non-external IDs that are not `react` or `react-dom` must be in fileTable."
      );
      return file.content;
    },
    transform(code, filename) {
      filename = filename.slice(MODULE_PREFIX.length);

      const file = fileTable.get(filename);
      if (file && file.language === "css") {
        // Append CSS as a style tag to the iframe <head> element.
        return `
          (() => {
            let stylesheet = document.getElementById("${filename}");

            // Remove and recreate the style tag to keep the order among style
            // tags up to date, so that CSS imported later overrides previous CSS.
            if (stylesheet) stylesheet.remove();

            stylesheet = document.createElement("style");
            stylesheet.setAttribute("id", "${filename}");
            document.head.appendChild(stylesheet);

            const styles = document.createTextNode(\`${code}\`);
            stylesheet.innerHTML = "";
            stylesheet.appendChild(styles);
          })();
        `;
      }

      const babelPlugins = getBabelPlugins(
        file?.language ?? null,
        enableForget,
        { flags: compilerFlags }
      );

      const babelOptions: TransformOptions = {
        presets: [["react", { runtime: "automatic" }]],
        plugins: babelPlugins,
        filename: filename.replace("./", ""),
      };

      /*
        TODO: Using the Babel Rollup plugin doesn't work out of the box due to
        this plugin treating the input tabs as a virtual file system. The Babel
        Rollup plugin's default configuration looks for files in the local file
        system, so it requires some set up for it to work (since it can work with
        this plugin in theory as Rollup plugins execute in turns by each hook).
      */
      const result = transform(code, babelOptions);

      if (!result?.code) this.error("Bundling failed.");

      return result.code;
    },
  };
}

/**
 * @see https://esm.sh/ - Development mode.
 */
const dev = (url: string) => `${url}?dev`;
