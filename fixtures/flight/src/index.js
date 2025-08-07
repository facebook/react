import * as React from 'react';
import {use, Suspense, useState, startTransition, Profiler} from 'react';
import ReactDOM from 'react-dom/client';
import {createFromFetch, encodeReply} from 'react-server-dom-webpack/client';

// TODO: This should be a dependency of the App but we haven't implemented CSS in Node yet.
import './style.css';

function findSourceMapURL(fileName) {
  return (
    document.location.origin +
    '/source-maps?name=' +
    encodeURIComponent(fileName)
  );
}

let updateRoot;
async function callServer(id, args) {
  let response;
  if (
    process.env.NODE_ENV === 'development' &&
    typeof WebSocketStream === 'function'
  ) {
    const requestId = crypto.randomUUID();
    const wss = new WebSocketStream(
      'ws://localhost:3001/debug-channel?' + requestId
    );
    const debugChannel = await wss.opened;
    response = createFromFetch(
      fetch('/', {
        method: 'POST',
        headers: {
          Accept: 'text/x-component',
          'rsc-action': id,
          'rsc-request-id': requestId,
        },
        body: await encodeReply(args),
      }),
      {
        callServer,
        debugChannel,
        findSourceMapURL,
      }
    );
  } else {
    response = createFromFetch(
      fetch('/', {
        method: 'POST',
        headers: {
          Accept: 'text/x-component',
          'rsc-action': id,
        },
        body: await encodeReply(args),
      }),
      {
        callServer,
        findSourceMapURL,
      }
    );
  }
  const {returnValue, root} = await response;
  // Refresh the tree with the new RSC payload.
  startTransition(() => {
    updateRoot(root);
  });
  return returnValue;
}

function Shell({data}) {
  const [root, setRoot] = useState(data);
  updateRoot = setRoot;
  return root;
}

async function hydrateApp() {
  let response;
  if (
    process.env.NODE_ENV === 'development' &&
    typeof WebSocketStream === 'function'
  ) {
    const requestId = crypto.randomUUID();
    const wss = new WebSocketStream(
      'ws://localhost:3001/debug-channel?' + requestId
    );
    const debugChannel = await wss.opened;
    response = createFromFetch(
      fetch('/', {
        headers: {
          Accept: 'text/x-component',
          'rsc-request-id': requestId,
        },
      }),
      {
        callServer,
        debugChannel,
        findSourceMapURL,
      }
    );
  } else {
    response = createFromFetch(
      fetch('/', {
        headers: {
          Accept: 'text/x-component',
        },
      }),
      {
        callServer,
        findSourceMapURL,
      }
    );
  }
  const {root, returnValue, formState} = await response;

  ReactDOM.hydrateRoot(
    document,
    <Profiler id="root">
      <Shell data={root} />
    </Profiler>,
    {
      // TODO: This part doesn't actually work because the server only returns
      // form state during the request that submitted the form. Which means it
      // the state needs to be transported as part of the HTML stream. We intend
      // to add a feature to Fizz for this, but for now it's up to the
      // metaframework to implement correctly.
      formState: formState,
    }
  );
}

// Remove this line to simulate MPA behavior
hydrateApp();
