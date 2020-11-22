import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom';
import ReactTransportDOMClient from 'react-transport-dom-webpack';
import {RefreshContext} from './Context.client';

let initialData = ReactTransportDOMClient.createFromFetch(
  fetch('http://localhost:3001')
);

function Content() {
  let [data, setData] = React.useState(initialData);

  function refresh() {
    setData(
      ReactTransportDOMClient.createFromFetch(fetch('http://localhost:3001'))
    );
  }

  return (
    <RefreshContext.Provider value={refresh}>
      {data.readRoot()}
    </RefreshContext.Provider>
  );
}

ReactDOM.unstable_createRoot(document.getElementById('root')).render(
  <Suspense fallback={<h1>Loading...</h1>}>
    <Content />
  </Suspense>
);

// Create entry points for Client Components.
// TODO: Webpack plugin should do this and write a map to disk.
require.context('./', true, /\.client\.js$/, 'lazy');
