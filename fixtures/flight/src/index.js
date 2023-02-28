import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import ReactServerDOMReader from 'react-server-dom-webpack/client';

// TODO: This should be a dependency of the App but we haven't implemented CSS in Node yet.
import './style.css';

let data = ReactServerDOMReader.createFromFetch(
  fetch('/', {
    headers: {
      Accept: 'text/x-component',
    },
  }),
  {
    callServer(id, args) {
      const response = fetch('/', {
        method: 'POST',
        headers: {
          Accept: 'text/x-component',
          'rsc-action': JSON.stringify({filepath: id.id, name: id.name}),
        },
        body: JSON.stringify(args),
      });
      return ReactServerDOMReader.createFromFetch(response);
    },
  }
);

// TODO: Once not needed once children can be promises.
function Content() {
  return React.use(data);
}

// TODO: This transition shouldn't really be necessary but it is for now.
React.startTransition(() => {
  ReactDOM.hydrateRoot(document, <Content />);
});
