import * as React from 'react';
import {renderToReadableStream} from 'react-server-dom-webpack/server';
import {createFromReadableStream} from 'react-server-dom-webpack/client';

export default async function App({prerender, noCache}) {
  return (
    <html lang="en">
      <head>
        <title>Flight</title>
      </head>
      <body>
        <p>hello</p>
      </body>
    </html>
  );
}
