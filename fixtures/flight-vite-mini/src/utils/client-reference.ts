import type { ClientReferenceManifest } from "../types";

export const clientReferenceManifest: ClientReferenceManifest = {
	resolveClientReference(reference: string) {
		const [id, name] = reference.split("#");
		let resolved: unknown;
		return {
			async preload() {
				let mod: Record<string, unknown>;
				if (import.meta.env.DEV) {
					mod = await import(/* @vite-ignore */ id);
				} else {
					const references = await import(
						"virtual:build-client-references" as string
					);
					mod = await references.default[id]();
				}
				resolved = mod[name];
			},
			get() {
				return resolved;
			},
		};
	},
};
