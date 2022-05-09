import * as React from 'react';
import {Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {createFromFetch} from 'react-server-dom-vite';

let data = createFromFetch(fetch('http://localhost:3000/__react'));

function Content() {
  return data.readRoot();
}

createRoot(document.getElementById('root')).render(
  <Suspense fallback={<h1>Loading...</h1>}>
    <Content />
  </Suspense>
);
