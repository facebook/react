import * as React from 'react';
import {use, Suspense, useState, startTransition} from 'react';
import ReactDOM from 'react-dom/client';
import {createFromFetch, encodeReply} from 'react-server-dom-esm/client';

const moduleBaseURL = '/src/';
let updateRoot;
async function callServer(id, args) {
  const response = fetch('/', {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'rsc-action': id,
    },
    body: await encodeReply(args),
  });
  const {returnValue, root} = await createFromFetch(response, {
    callServer,
    moduleBaseURL,
  });
  // Refresh the tree with the new RSC payload.
  startTransition(() => {
    updateRoot(root);
  });
  return returnValue;
}

let data = createFromFetch(
  fetch('/', {
    headers: {
      Accept: 'text/x-component',
    },
  }),
  {
    callServer,
    moduleBaseURL,
  }
);

function Shell({data}) {
  const [root, setRoot] = useState(use(data));
  updateRoot = setRoot;
  return root;
}

ReactDOM.hydrateRoot(document, React.createElement(Shell, {data}));
