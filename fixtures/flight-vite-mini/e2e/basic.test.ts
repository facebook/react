import { type Page, expect, test } from "@playwright/test";
import { createEditor } from "./helper";

test("client reference", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();
	await page.getByText("Client counter: 0").click();
	await page
		.getByTestId("client-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Client counter: 1").click();
	await page.reload();
	await page.getByText("Client counter: 0").click();
});

test("server reference in server @js", async ({ page }) => {
	await testServerAction(page);
});

test.describe(() => {
	test.use({ javaScriptEnabled: false });
	test("server reference in server @nojs", async ({ page }) => {
		await testServerAction(page);
	});
});

async function testServerAction(page: Page) {
	await page.goto("/");
	await page.getByText("Server counter: 0").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Server counter: 1").click();
	await page.goto("/");
	await page.getByText("Server counter: 1").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "-" })
		.click();
	await page.getByText("Server counter: 0").click();
}

test("server reference in client @js", async ({ page }) => {
	await testServerAction2(page, { js: true });
});

test.describe(() => {
	test.use({ javaScriptEnabled: false });
	test("server reference in client @nojs", async ({ page }) => {
		await testServerAction2(page, { js: false });
	});
});

async function testServerAction2(page: Page, options: { js: boolean }) {
	await page.goto("/");
	if (options.js) {
		await page.getByText("[hydrated: 1]").click();
	}
	await page.locator('input[name="x"]').fill("2");
	await page.locator('input[name="y"]').fill("3");
	await page.locator('input[name="y"]').press("Enter");
	await expect(page.getByTestId("calculator-answer")).toContainText("5");
	await page.locator('input[name="x"]').fill("2");
	await page.locator('input[name="y"]').fill("three");
	await page.locator('input[name="y"]').press("Enter");
	await expect(page.getByTestId("calculator-answer")).toContainText(
		"(invalid input)",
	);
	if (options.js) {
		await expect(page.locator('input[name="x"]')).toHaveValue("2");
		await expect(page.locator('input[name="y"]')).toHaveValue("three");
	} else {
		await expect(page.locator('input[name="x"]')).toHaveValue("");
		await expect(page.locator('input[name="y"]')).toHaveValue("");
	}
}

test("client hmr @dev", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();
	// client +1
	await page.getByText("Client counter: 0").click();
	await page
		.getByTestId("client-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Client counter: 1").click();
	// edit client
	using file = createEditor("src/app/client.tsx");
	file.edit((s) => s.replace("Client counter", "Client [EDIT] counter"));
	await page.getByText("Client [EDIT] counter: 1").click();
});

test("server hmr @dev", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();

	// server +1
	await page.getByText("Server counter: 0").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Server counter: 1").click();

	// client +1
	await page.getByText("Client counter: 0").click();
	await page
		.getByTestId("client-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Client counter: 1").click();

	// edit server
	using file = createEditor("src/app/index.tsx");
	file.edit((s) => s.replace("Server counter", "Server [EDIT] counter"));
	await page.getByText("Server [EDIT] counter: 1").click();
	await page.getByText("Client counter: 1").click();

	// server -1
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "-" })
		.click();
	await page.getByText("Server [EDIT] counter: 0").click();
});
