import * as React from 'react';
import {use, useState, startTransition} from 'react';
import ReactDOM from 'react-dom/client';
import {createFromFetch, encodeReply} from 'react-server-dom-vite/client';

const moduleBaseURL = '/src/';
let updateRoot;

if (typeof window !== 'undefined') {
  globalThis.__vite_module_cache__ = new Map();
  globalThis.__vite_require__ = id => {
    if (process.env.NODE_ENV === 'development') {
      let moduleId = `/@fs${id}`;
      return import(/* @vite-ignore */ moduleId);
    } else {
      let moduleId = `/${id}.js`;
      return import(/* @vite-ignore */ moduleId);
    }
  };
}

async function callServer(id, args) {
  const response = fetch('/', {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'rsc-action': JSON.stringify(id),
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

if (import.meta.hot) {
  import.meta.hot.on('reload-rsc', async () => {
    updateRoot(
      await createFromFetch(
        fetch('/', {
          headers: {
            Accept: 'text/x-component',
          },
        }),
        {
          callServer,
          moduleBaseURL,
        }
      )
    );
  });
}

function Shell({data}) {
  const [root, setRoot] = useState(use(data));
  updateRoot = setRoot;

  return root;
}

ReactDOM.hydrateRoot(document, React.createElement(Shell, {data}));
