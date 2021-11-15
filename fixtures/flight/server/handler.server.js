'use strict';

const {renderToPipeableStream} = require('react-server-dom-webpack/writer');
const {readFile} = require('fs');
const {resolve} = require('path');
const React = require('react');

module.exports = function(req, res) {
  // const m = require('../src/App.server.js');
  import('../src/App.server.js').then(m => {
    const dist = process.env.NODE_ENV === 'development' ? 'dist' : 'build';
    readFile(
      resolve(__dirname, `../${dist}/react-client-manifest.json`),
      'utf8',
      (err, data) => {
        if (err) {
          throw err;
        }

        const App = m.default.default || m.default;
        res.setHeader('Access-Control-Allow-Origin', '*');
        const moduleMap = JSON.parse(data);
        const {pipe} = renderToPipeableStream(
          React.createElement(App),
          moduleMap
        );
        pipe(res);
      }
    );
  });
};
