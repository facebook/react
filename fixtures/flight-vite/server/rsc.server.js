import {renderToPipeableStream} from 'react-server-dom-vite/writer';
import React from 'react';
import App from '../src/App.server.jsx';

export default function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {pipe} = renderToPipeableStream(React.createElement(App));
  pipe(res);
}
