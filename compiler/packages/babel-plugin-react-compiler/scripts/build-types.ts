/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EnvironmentConfigSchema } from "../src/HIR/Environment";
import { zodToTs, printNode, createTypeAlias } from "zod-to-ts";
import fs from "fs";
import path from "path";
import { unstable_translateTSDefToFlowDef } from "flow-api-translator";

async function main() {
  const bannerTS = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 */

`;

  const bannerFlow = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @nolint
 * @preventMunge
 */

`;

  const schemasToExport = {
    EnvironmentConfig: EnvironmentConfigSchema,
  };

  const OUTPUT_DIR = path.resolve(__dirname, "../dist/unstable-types");
  try {
    fs.rmdirSync(OUTPUT_DIR, { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const declarations = Object.entries(schemasToExport)
    .map(
      ([name, schema]) =>
        "export " +
        printNode(
          createTypeAlias(
            zodToTs(schema, name, { nativeEnums: "union" }).node,
            name
          )
        )
    )
    .join("\n");

  const outputTS = bannerTS + declarations + "\n";

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.d.ts"), outputTS);

  const outputFlow =
    bannerFlow + (await unstable_translateTSDefToFlowDef(declarations)) + "\n";

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.js"), outputFlow);
}

main().catch((e) => {
  throw e;
});
