// @ts-ignore
import * as ReactClient from 'react-server-dom-vite/client.edge';
import React from 'react';
import type {ReactFormState} from 'react-dom/client';
// @ts-ignore
import * as ReactDomServer from 'react-dom/server.edge';
import {injectRSCPayload} from 'rsc-html-stream/server';
import type {RscPayload} from './entry.rsc';

import {assetsManifest, getModuleLoading, loadModule} from '../basic/ssr';

ReactClient.setPreloadModule(loadModule);

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
      moduleLoading: getModuleLoading(),
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

  let finalStream = htmlStream.pipeThrough(injectRSCPayload(stream2));
  if (nonce) {
    finalStream = finalStream.pipeThrough(injectNonce(nonce));
  }
  return finalStream;
}

function injectNonce(nonce: string) {
  // replace rsc-html-stream's inline <script> with <script nonce="...">
  // TODO: upstream
  const target = new TextEncoder().encode(`<script>`);
  const replacement = new TextEncoder().encode(`<script nonce="${nonce}">`);
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (target.every((byte, i) => byte === chunk[i])) {
        controller.enqueue(replacement);
        controller.enqueue(chunk.slice(target.length));
      } else {
        controller.enqueue(chunk);
      }
    },
  });
}
