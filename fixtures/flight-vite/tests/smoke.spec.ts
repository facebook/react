import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await expect(page).toHaveTitle(/Home/);
});

test("promise as a child hydrates without errors", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await expect(page.getByTestId("promise-as-a-child-test")).toHaveText(
		"Promise as a child hydrates without errors: deferred text",
	);
});

test("can increment counter", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await page.click("button:has-text('Count: 0')");
	await page.waitForSelector("button:has-text('Count: 1')");
});

test("can run form actions with global state", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await page.fill("input[name=name]", "World");
	await page.click("button:has-text('Say Hi')");
	await page.waitForSelector("h1:has-text('Hi World')");
	await page.click("button:has-text('Like')");
	await page.waitForSelector("h1:has-text('Liked!')");
});

test("can client navigate", async ({ page }) => {
	await page.goto("/about", { waitUntil: "networkidle" });
	await expect(page).toHaveTitle(/About/);

	let intercepted: undefined | [string, string, string] = undefined;
	page.route(/.*/, (route) => {
		if (!intercepted) {
			const request = route.request();
			const url = new URL(request.url());
			intercepted = [
				request.method(),
				request.headers().accept,
				url.pathname + url.search,
			];
		}
		return route.continue();
	});

	await page.click("a:has-text('Home')");
	await expect(page).toHaveTitle(/Home/);
	await expect(page.getByTestId("promise-as-a-child-test")).toHaveText(
		"Promise as a child hydrates without errors: deferred text",
	);
	expect(intercepted).toEqual(["GET", "text/x-component", "/"]);

	await page.click("a:has-text('About')");
	await expect(page).toHaveTitle(/About/);
});
