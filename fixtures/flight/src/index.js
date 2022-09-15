import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import ReactServerDOMReader from 'react-server-dom-webpack';

let data = ReactServerDOMReader.createFromFetch(fetch('http://localhost:3001'));

function Content() {
  return React.experimental_use(data);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Suspense fallback={<h1>Loading...</h1>}>
    <Content />
  </Suspense>
);
