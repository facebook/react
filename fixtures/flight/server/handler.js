'use strict';

const ReactFlightDOMServer = require('react-flight-dom-webpack/server');
const React = require('react');
const Stream = require('stream');

function Text({children}) {
  return <span>{children}</span>;
}

function HTML() {
  return (
    <div>
      <Text>Hello</Text>
      <Text>world</Text>
    </div>
  );
}

module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let model = {
    content: {
      __html: <HTML />,
    },
  };
  ReactFlightDOMServer.pipeToNodeWritable(model, res);
};
