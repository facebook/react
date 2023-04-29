import * as React from 'react';
import {use, Suspense} from 'react';
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

function Shell({data}) {
  return use(data);
}

ReactDOM.hydrateRoot(document, <Shell data={data} />);
