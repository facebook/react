"use server";

let counter = 0;

export function getCounter() {
	return counter;
}

export async function changeCounter(formData: FormData) {
	const change = Number(formData.get("change"));
	counter += change;
}
