// @ts-ignore
import * as ReactClient from 'react-server-dom-vite/client.edge';
import React from 'react';
import type {ReactFormState} from 'react-dom/client';
// @ts-ignore
import * as ReactDomServer from 'react-dom/server.edge';
import {injectRSCPayload} from 'rsc-html-stream/server';
import type {RscPayload} from './entry.rsc';

import {assetsManifest, loadModule, prepareDestination} from '../basic/ssr';

ReactClient.setPreloadModule(loadModule, prepareDestination);

export async function renderHtml({
  url,
  stream,
  formState,
  nonce,
}: {
  url: URL;
  stream: ReadableStream;
  formState?: ReactFormState;
  nonce?: string;
}) {
  const [stream1, stream2] = stream.tee();

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= ReactClient.createFromReadableStream<RscPayload>(stream1, {
      nonce,
    });
    return React.use(payload).root;
  }

  const htmlStream = await ReactDomServer.renderToReadableStream(<SsrRoot />, {
    bootstrapModules: url.search.includes('__nojs')
      ? []
      : assetsManifest.entry.bootstrapModules,
    nonce,
    // @ts-ignore
    formState,
  });

  return htmlStream.pipeThrough(injectRSCPayload(stream2, {nonce}));
}
