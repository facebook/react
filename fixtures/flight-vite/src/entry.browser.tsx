// @ts-ignore
import * as ReactClient from 'react-server-dom-vite/client.browser';
import React from 'react';
import ReactDomClient from 'react-dom/client';
import {rscStream} from 'rsc-html-stream/client';
import type {RscPayload} from './entry.rsc';
import {findSourceMapURL, loadModule, setCallServer} from '../basic/browser';

ReactClient.setPreloadModule(loadModule);

async function main() {
  const callServer = async (id: string, args: unknown) => {
    const temporaryReferences = ReactClient.createTemporaryReferenceSet();
    const payload = await ReactClient.createFromFetch<RscPayload>(
      fetch(window.location.href, {
        method: 'POST',
        body: await ReactClient.encodeReply(args, {temporaryReferences}),
        headers: {
          'x-rsc-action': id,
        },
      }),
      {...rscOptions, temporaryReferences},
    );
    setPayload(payload);
    return payload.returnValue;
  };
  setCallServer(callServer);
  const rscOptions = {callServer, findSourceMapURL};

  let setPayload: (v: RscPayload) => void;
  const initialPayload: RscPayload = await ReactClient.createFromReadableStream(
    rscStream,
    rscOptions,
  );

  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload);

    React.useEffect(() => {
      setPayload = v => React.startTransition(() => setPayload_(v));
    }, [setPayload_]);

    return payload.root;
  }

  const browserRoot = (
    <React.StrictMode>
      <BrowserRoot />
    </React.StrictMode>
  );

  ReactDomClient.hydrateRoot(document, browserRoot, {
    formState: initialPayload.formState,
  });

  if (import.meta.hot) {
    import.meta.hot.on('rsc:update', async () => {
      const payload = await ReactClient.createFromFetch<RscPayload>(
        fetch(window.location.href),
        rscOptions,
      );
      setPayload(payload);
    });
  }
}

main();
