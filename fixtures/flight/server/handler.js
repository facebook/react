'use strict';

const {readFile} = require('fs').promises;
const {resolve} = require('path');
const React = require('react');

module.exports = async function (req, res) {
  const {renderToPipeableStream} = await import(
    'react-server-dom-webpack/server'
  );
  switch (req.method) {
    case 'POST': {
      const serverReference = JSON.parse(req.get('rsc-action'));
      const {filepath, name} = serverReference;
      const action = (await import(filepath))[name];
      // Validate that this is actually a function we intended to expose and
      // not the client trying to invoke arbitrary functions. In a real app,
      // you'd have a manifest verifying this before even importing it.
      if (action.$$typeof !== Symbol.for('react.server.reference')) {
        throw new Error('Invalid action');
      }

      const args = JSON.parse(req.body);
      const result = action.apply(null, args);

      res.setHeader('Access-Control-Allow-Origin', '*');
      const {pipe} = renderToPipeableStream(result, {});
      pipe(res);

      return;
    }
    default: {
      // const m = require('../src/App.js');
      const m = await import('../src/App.js');
      const dist = process.env.NODE_ENV === 'development' ? 'dist' : 'build';
      const data = await readFile(
        resolve(__dirname, `../${dist}/react-client-manifest.json`),
        'utf8'
      );
      const App = m.default.default || m.default;
      res.setHeader('Access-Control-Allow-Origin', '*');
      const moduleMap = JSON.parse(data);
      const {pipe} = renderToPipeableStream(
        React.createElement(App),
        moduleMap
      );
      pipe(res);
      return;
    }
  }
};
