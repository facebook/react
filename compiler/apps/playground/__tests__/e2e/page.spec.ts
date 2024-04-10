/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect, test } from "@playwright/test";

const delay = 50;

function concat(data: Array<string>): string {
  return data.join("");
}

test("editor should compile successfully", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // User input compiles
  const monacoEditor = page.locator(".monaco-editor").nth(0);
  await monacoEditor.click();
  await page.keyboard.press("Meta+KeyA", { delay });
  await page.keyboard.type("export default function TestComponent({ x }) {\n");
  await page.keyboard.type("return <Button>{x}</Button>;\n");
  await page.getByRole("button", { name: /JS/ }).click();
  const userInput =
    (await page.locator(".monaco-editor").nth(2).allInnerTexts()) ?? [];
  expect(concat(userInput)).toMatchSnapshot("user-input.txt");

  // Reset button works
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset" }).click();
  const defaultInput =
    (await page.locator(".monaco-editor").nth(2).allInnerTexts()) ?? [];
  expect(concat(defaultInput)).toMatchSnapshot("default-input.txt");
});
