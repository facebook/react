import * as React from 'react';

import {createFromFetch, encodeReply} from 'react-server-dom-vite/client';
import {startTransition, use, useState} from 'react';

import ReactDOM from 'react-dom/client';

const moduleBaseURL = '/src/';
let updateRoot;

if (typeof window !== 'undefined') {
  globalThis.__vite_module_cache__ = new Map();
  globalThis.__vite_preload__ = metadata => {
    const existingPromise = __vite_module_cache__.get(metadata);
    if (existingPromise) {
      if (existingPromise.status === 'fulfilled') {
        return null;
      }
      return existingPromise;
    } else {
      let moduleId;
      if (process.env.NODE_ENV === 'development') {
        moduleId = `/@fs${metadata}`;
      } else {
        moduleId = `/${metadata}.js`;
      }

      const modulePromise = import(/* @vite-ignore */ moduleId);
      modulePromise.then(
        value => {
          const fulfilledThenable = modulePromise;
          fulfilledThenable.status = 'fulfilled';
          fulfilledThenable.value = value;
        },
        reason => {
          const rejectedThenable = modulePromise;
          rejectedThenable.status = 'rejected';
          rejectedThenable.reason = reason;
        }
      );
      __vite_module_cache__.set(metadata, modulePromise);
      return modulePromise;
    }
  };

  globalThis.__vite_require__ = metadata => {
    let moduleExports;
    // We assume that preloadModule has been called before, which
    // should have added something to the module cache.
    const promise = __vite_module_cache__.get(metadata);
    if (promise) {
      if (promise.status === 'fulfilled') {
        moduleExports = promise.value;
      } else {
        throw promise.reason;
      }
      return moduleExports;
    } else {
      throw new Error('Module not found in cache: ' + id);
    }
  };
}

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

  console.log(await returnValue);
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
