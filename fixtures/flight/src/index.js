import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom';
import ReactTransportDOMClient from 'react-transport-dom-webpack';
import {CacheContext, createCache} from 'react/unstable-cache';

let data = ReactTransportDOMClient.createFromFetch(
  fetch('http://localhost:3001')
);

function Content() {
  return data.readRoot();
}

let cache = createCache();

ReactDOM.render(
  <CacheContext.Provider value={cache}>
    <Suspense fallback={<h1>Loading...</h1>}>
      <Content />
    </Suspense>
  </CacheContext.Provider>,
  document.getElementById('root')
);

// Create entry points for Client Components.
// TODO: Webpack plugin should do this and write a map to disk.
require.context('./', true, /\.client\.js$/, 'lazy');
