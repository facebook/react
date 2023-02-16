'use strict';

const {renderToPipeableStream} = require('react-server-dom-webpack/server');
const React = require('react');
const fs = require('fs');
const { promisify }= require('util');
const path = require('path');

// Convert the `fs.readFile` function to an asynchronous function using `promisify`
const readFileAsync = promisify(fs.readFile);

// Validates the action received in the POST
const validateAction = (action) => {
  if(action.$$typeof !== Symbol.for('reac.server.reference')){
    throw new Error('Invalid action');
  }
}

// Export an asynchronous function that handles requests
module.exports = async function (req, res) {
  switch (req.method) {
    case 'POST': {
      // Extract the file path from the request
      const { filepath } = JSON.parse(req.get('rsc-action'));
      const { default: action } = await import(filepath);
      validateAction(action);

      // Extract the arguments from the request and execute the action
      const args = JSON.parse(req.body);
      const result = action(...args);

      // Set the response header
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Render the result of the action as a stream of data and send the response
      const { pipe } = renderToPipeableStream(result, {});
      pipe(res);

      break;
    }
    // If the request method is different from POST, do the following:
    default: {
      // const m = require('../src/App.js');
      const { default: App} = await import('../src/App.js');
      /// Determine destination directory based on runtime
      const dist = process.env.NODE_ENV === 'development' ? 'dist' : 'build';
      // Read the `react-client-manifest.json` file from the destination directory
      const manifestPath = path.join(__dirname, '..', dist, 'react-client-manifest.json');

      if(!fs.existsSync(manifestPath)) {
        throw new Error (`Manifest file not found: ${manifestPath}`);
      }

      const data = await readFileAsync(manifestPath, 'utf-8');

      // Set the response header
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Convert the `App` component to a data stream and send the response
      const moduleMap = JSON.parse(data);
      const { pipe } = renderToPipeableStream(React.createElement(App),moduleMap);
      pipe(res);
      return;
    }
  }
};
