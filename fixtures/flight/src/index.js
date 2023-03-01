import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import ReactServerDOMReader from 'react-server-dom-webpack/client';

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

function Content() {
  return React.use(data);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Suspense fallback={<h1>Loading...</h1>}>
    <Content />
  </Suspense>
);
