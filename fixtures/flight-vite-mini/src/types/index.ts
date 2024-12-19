export type ClientReferenceMetadataManifest = {
	resolveClientReferenceMetadata(metadata: { $$id: string }): string;
};

export type ClientReferenceManifest = {
	resolveClientReference(reference: string): {
		preload(): Promise<void>;
		get(): unknown;
	};
};

export type ServerReferenceManifest = {
	resolveServerReference(reference: string): {
		preload(): Promise<void>;
		get(): unknown;
	};
};

export type CallServerFn = (id: string, args: unknown[]) => unknown;
