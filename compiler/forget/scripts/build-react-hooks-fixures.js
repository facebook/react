/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const { tests } = require("./eslint-plugin-react-hooks-test-cases");
const {
  runReactForgetBabelPlugin,
} = require("../dist/Babel/RunReactForgetBabelPlugin");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const prettierConfigPath = require.resolve("../.prettierrc");
const process = require("process");

const FIXTURES_DIR = path.join(
  process.cwd(),
  "src",
  "__tests__",
  "fixtures",
  "compiler",
  "rules-of-hooks"
);

const fixtures = [];
for (const test of tests.valid) {
  fixtures.push({ code: test.code, valid: true });
}
for (const test of tests.invalid) {
  fixtures.push({ code: test.code, valid: false });
}

let index = 0;
for (const fixture of fixtures) {
  let error = null;
  let passes = true;
  try {
    // Does the fixture pass with hooks validation disabled? if not skip it
    runReactForgetBabelPlugin(fixture.code, "rules-of-hooks.js", "typescript", {
      environment: {
        validateHooksUsage: false,
      },
    });
    // Does the fixture pass with hooks validation enabled?
    try {
      runReactForgetBabelPlugin(
        fixture.code,
        "rules-of-hooks.js",
        "typescript",
        {
          environment: {
            validateHooksUsage: true,
          },
        }
      );
    } catch (e) {
      passes = false;
    }
  } catch (e) {
    error = e;
  }
  let name = `rules-of-hooks-${index}.js`;
  let code = fixture.code;
  if (error !== null) {
    name = `todo.${name}`;
    code = `// @skip\n${code}`;
  } else if (fixture.valid === false) {
    name = `error.${name}`;
    if (passes) {
      // oops, passed when we expected an error
      name = `todo.${name}`;
      code = `// @skip\n${code}`;
    }
  } else if (!passes) {
    // oops, error when it should have passed
    name = `todo.${name}`;
    code = `// @skip\n${code}`;
  }

  const fixturePath = path.join(FIXTURES_DIR, name);
  const options = prettier.resolveConfig.sync(fixturePath, {
    config: prettierConfigPath,
  });
  const formatted = prettier.format(code, options);
  fs.writeFileSync(fixturePath, formatted, "utf8");
  index++;
}
