/** @jest-environment jsdom */

console.log('STARTED');

beforeEach(() => {
  jest.resetModules();
});

it('should not crash in jsdom env', () => {
  require('scheduler');
});

it('should not crash in jsdom env with jest jsdom', () => {
  const React = require('react');
  const ReactDOM = require('react-dom');
  function Effecty() {
    React.useEffect(() => {}, []);
    return null;
  }

  ReactDOM.render(<Effecty />, document.createElement('div'));
});

it('should not crash in jsdom env with jsdom', () => {
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

  ReactDOM.render(<Effecty />, document.createElement('div'));
});
