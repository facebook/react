"use server";

import { context, url } from "./server-context.js";

export async function like() {
	if (url().searchParams.has("error")) {
		await Promise.reject(new Error("artificial error"));
	}

	context("state", "Liked!");
}

export async function greet(formData: FormData) {
	const name = formData.get("name") || "you";
	context("state", `Hi ${name}`);
}

export async function increment(n: number) {
	return n + 1;
}

export function logMessage(formData: FormData) {
	console.log(formData.get("message"));
}
