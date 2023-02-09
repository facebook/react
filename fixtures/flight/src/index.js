import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import ReactServerDOMReader from 'react-server-dom-webpack/client';

let data = ReactServerDOMReader.createFromFetch(
  fetch('http://localhost:3001'),
  {
    callServer(id, args) {
      const response = fetch('http://localhost:3001', {
        method: 'POST',
        cors: 'cors',
        headers: {
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
