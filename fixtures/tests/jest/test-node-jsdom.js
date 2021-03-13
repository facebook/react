/** @jest-environment node */

console.log('STARTED');

it('should not crash in node env with jsdom', () => {
  var { JSDOM } = require('jsdom');
  var { window } = new JSDOM();
  global.window = window;
  global.document = window.document;
  global.navigator = {userAgent: ''}
  const React = require('react');
  const ReactDOM = require('react-dom');
  function Effecty() {
    React.useEffect(() => {}, []);
    return null;
  }

  ReactDOM.render(<Effecty />, document.createElement('div'));
});
