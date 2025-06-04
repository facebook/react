import {testSerializationAction} from './action';
import {TestSerializationClient} from './client';

// @ts-ignore
import * as ReactServer from 'react-server-dom-vite/server.edge';
// @ts-ignore
import * as ReactClient from 'react-server-dom-vite/client.edge';
import {deserialize, serialize} from '../../../basic/rsc';

export function TestSerializationServer() {
  const original = <TestSerializationClient action={testSerializationAction} />;
  const serialized = serialize(original);
  const deserialized = deserialize<typeof original>(serialized);
  return <div>test-serialization:{deserialized}</div>;
}
