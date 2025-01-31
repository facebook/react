import {type ClientReference} from '../../ReactFlightViteReferences';
import {type ServerManifest} from '../../client/ReactFlightClientConfigBundlerVite';
import {type ClientManifest} from '../../server/ReactFlightServerConfigViteBundler';

exports.mockClient = function mockClient({
  client,
}: {
  client?: {
    [key: keyof typeof client]: mixed,
  },
} = {}): {
  references: {
    [key: keyof typeof client]: ClientReference<
      (typeof client)[keyof typeof client],
    >,
  },
  manifest: ClientManifest,
} {
  return {
    clientReferences: Object.keys(client ?? {}).reduce(
      (p, c) =>
        Object.assign(p, {
          [c]: {
            $$typeof: Symbol.for('react.client.reference'),
            $$id: c,
          },
        }),
      {},
    ),
    manifest: {
      resolveClientReferenceMetadata(clientReference) {
        if (clientReference.$$id in (client ?? {})) {
          return [clientReference.$$id, 'export_name'];
        }
        throw new Error(`No mock provided for ${clientReference.$$id}.`);
      },
    },
  };
};

exports.mockServer = function mockServer({
  client,
}: {
  client?: {
    [key: keyof typeof client]: mixed,
  },
} = {}): {
  manifest: ServerManifest,
} {
  return {
    manifest: {
      resolveClientReference(metadata) {
        const name = metadata[0];
        if (name in client ?? {}) {
          return {
            get() {
              return client[name];
            },
            async preload() {},
          };
        }
        throw new Error(`No mock provided for ${name}.`);
      },
      resolveServerReference(id) {
        throw new Error('resolveServerReference not yet implemented');
      },
    },
  };
};
