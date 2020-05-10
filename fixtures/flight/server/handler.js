'use strict';

const ReactTransportDOMServer = require('react-transport-dom-webpack/server');
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
    content: <HTML />,
  };
  ReactTransportDOMServer.pipeToNodeWritable(model, res);
};
