const React = require('react');
const {renderToPipeableStream} = require('react-server-dom-webpack/server');
const App = require('./App');
const AppAsync = require('./AppAsync');

function renderRSC(clientManifest, Component, itemCount) {
  const element = React.createElement(Component, {itemCount});
  return renderToPipeableStream(element, clientManifest);
}

module.exports = renderRSC;
module.exports.App = App;
module.exports.AppAsync = AppAsync;
