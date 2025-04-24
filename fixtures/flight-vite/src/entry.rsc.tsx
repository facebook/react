// @ts-ignore
import * as ReactServer from 'react-server-dom-vite/server.edge';
import type React from 'react';
import type {ReactFormState} from 'react-dom/client';
import {Root} from './routes/root';
import {assetsManifest, importSsr, loadModule} from '../basic/rsc';

ReactServer.setPreloadModule(loadModule);

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

export default async function handler(request: Request): Promise<Response> {
  const nonce = process.env.DISABLE_NONCE ? undefined : crypto.randomUUID();

  function RscRoot() {
    const js = assetsManifest.entry.deps.js.map((href: string) => (
      <link key={href} rel="modulepreload" href={href} nonce={nonce} />
    ));
    const css = assetsManifest.entry.deps.css.map((href: string) => (
      <link key={href} rel="stylesheet" href={href} precedence="high" />
    ));
    // https://vite.dev/guide/features.html#content-security-policy-csp
    const viteCsp = nonce && <meta property="csp-nonce" nonce={nonce} />;
    return (
      <>
        {js}
        {css}
        {viteCsp}
        <Root url={new URL(request.url)} />
      </>
    );
  }

  return renderRsc(request, <RscRoot />, {nonce});
}

async function renderRsc(
  request: Request,
  root: React.ReactNode,
  options: {nonce?: string},
): Promise<Response> {
  const url = new URL(request.url);
  const isAction = request.method === 'POST';

  // override with ?__rsc and ?__html for quick debugging
  const isRscRequest =
    (!request.headers.get('accept')?.includes('text/html') &&
      !url.searchParams.has('__html')) ||
    url.searchParams.has('__rsc');

  // action
  let returnValue: unknown | undefined;
  let formState: ReactFormState | undefined;
  let temporaryReferences: unknown | undefined;
  if (isAction) {
    const actionId = request.headers.get('x-rsc-action');
    if (actionId) {
      // client stream request
      const contentType = request.headers.get('content-type');
      const body = contentType?.startsWith('multipart/form-data')
        ? await request.formData()
        : await request.text();
      temporaryReferences = ReactServer.createTemporaryReferenceSet();
      const args = await ReactServer.decodeReply(body, {temporaryReferences});
      const action = await ReactServer.loadServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(formData);
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  const rscPayload: RscPayload = {root, formState, returnValue};
  const rscOptions = {temporaryReferences, nonce: options.nonce};
  const stream = ReactServer.renderToReadableStream(rscPayload, rscOptions);

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/x-component;charset=utf-8',
      },
    });
  }

  const ssr = await importSsr<typeof import('./entry.ssr')>();
  const htmlStream = await ssr.renderHtml({
    url,
    stream,
    formState,
    nonce: options.nonce,
  });
  const headers = new Headers({'Content-Type': 'text/html;charset=utf-8'});
  if (options.nonce) {
    headers.set(
      'Content-Security-Policy',
      // allow eval during dev for `createFakeFunction` eval
      `script-src 'nonce-${options.nonce}' ${import.meta.env.DEV ? `'unsafe-eval'` : ''};`,
    );
  }
  return new Response(htmlStream, {headers});
}
