import fs from "node:fs";

export function createEditor(filepath: string) {
	let init = fs.readFileSync(filepath, "utf-8");
	let data = init;
	return {
		edit(editFn: (data: string) => string) {
			data = editFn(data);
			fs.writeFileSync(filepath, data);
		},
		[Symbol.dispose]() {
			fs.writeFileSync(filepath, init);
		},
	};
}
