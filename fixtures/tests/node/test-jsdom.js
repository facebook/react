console.log('STARTED');

var {JSDOM} = require('jsdom');
var {window} = new JSDOM();
global.window = window;
global.document = window.document;
global.navigator = {userAgent: ''};

const React = require('react');
const ReactDOM = require('react-dom');
function Effecty() {
  React.useEffect(() => {}, []);
  return null;
}

ReactDOM.render(
  React.createElement(Effecty, {}),
  document.createElement('div')
);
