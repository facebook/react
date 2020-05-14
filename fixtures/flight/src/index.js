import React from 'react';
import ReactDOM from 'react-dom';
import ReactTransportDOMClient from 'react-transport-dom-webpack';
import App from './App';

let data = ReactTransportDOMClient.createFromFetch(
  fetch('http://localhost:3001')
);

ReactDOM.render(<App data={data} />, document.getElementById('root'));
