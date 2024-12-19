"use server";

export async function add(_prev: unknown, formData: FormData) {
	let x = formData.get("x");
	let y = formData.get("y");
	if (typeof x === "string" && typeof y === "string") {
		let x2 = parseFloat(x);
		let y2 = parseFloat(y);
		if (!Number.isNaN(x2) && !Number.isNaN(y2)) {
			return x2 + y2;
		}
	}
	return "(invalid input)";
}
