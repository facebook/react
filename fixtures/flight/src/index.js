import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import {createFromFetch, encodeReply} from 'react-server-dom-webpack/client';

// TODO: This should be a dependency of the App but we haven't implemented CSS in Node yet.
import './style.css';

let data = createFromFetch(
  fetch('/', {
    headers: {
      Accept: 'text/x-component',
    },
  }),
  {
    async callServer(id, args) {
      const response = fetch('/', {
        method: 'POST',
        headers: {
          Accept: 'text/x-component',
          'rsc-action': id,
        },
        body: await encodeReply(args),
      });
      return createFromFetch(response);
    },
  }
);

// TODO: This transition shouldn't really be necessary but it is for now.
React.startTransition(() => {
  ReactDOM.hydrateRoot(document, data);
});
