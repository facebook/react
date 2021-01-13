import * as React from 'react';
import {Suspense} from 'react';
import ReactDOM from 'react-dom';
import ReactServerDOMReader from 'react-server-dom-webpack';

let data = ReactServerDOMReader.createFromFetch(fetch('http://localhost:3001'));

function Content() {
  return data.readRoot();
}

ReactDOM.render(
  <Suspense fallback={<h1>Loading...</h1>}>
    <Content />
  </Suspense>,
  document.getElementById('root')
);
