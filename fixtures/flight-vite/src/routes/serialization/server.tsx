import { testSerializationAction } from "./action";
import { TestSerializationClient } from "./client";

// @ts-ignore
import * as ReactServer from 'react-server-dom-vite/server.edge';
// @ts-ignore
import * as ReactClient from 'react-server-dom-vite/client.edge';

export function TestSerializationServer() {
  const original = <TestSerializationClient action={testSerializationAction} />;
  const serialized = ReactServer.renderToReadableStream(original);
  const deserialized = ReactClient.createFromReadableStream(serialized, {
    serverConsumerManifest: {
      // non-null `serverModuleMap` is enough to make react flight restore original server references.
      serverModuleMap: {},
    }
  });
  return <div>test-serialization:{deserialized}</div>;
}
