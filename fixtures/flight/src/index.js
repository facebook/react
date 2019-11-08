import React from 'react';
import ReactDOM from 'react-dom';
import ReactFlightDOMClient from 'react-dom/unstable-flight-client';
import App from './App';

let data = ReactFlightDOMClient.readFromFetch(fetch('http://localhost:3001'));
ReactDOM.render(<App data={data} />, document.getElementById('root'));
