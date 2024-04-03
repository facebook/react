/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect, test } from "@playwright/test";

test("editor should compile successfully", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Wipe" }).click();
  await page.getByRole("button", { name: /JS/ }).click();
  const results =
    (await page.locator(".monaco-editor").nth(2).allInnerTexts()) ?? [];
  expect(
    results.reduce((buffer, str) => {
      buffer.concat(str);
      return buffer;
    }),
  ).toMatchSnapshot("results.txt");
});
