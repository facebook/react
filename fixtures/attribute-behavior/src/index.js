import {loadScript} from './react-loader';
import './index.css';

(async function foo() {
  await loadScript('https://unpkg.com/react@15.6.1/dist/react.js');
  await loadScript('https://unpkg.com/react-dom@15.6.1/dist/react-dom.js');
  await loadScript(
    'https://unpkg.com/react-dom@15.6.1/dist/react-dom-server.js'
  );
  window.React15 = window.React;
  window.ReactDOM15 = window.ReactDOM;
  window.ReactDOMServer15 = window.ReactDOMServer;
  delete window.React;
  delete window.ReactDOM;
  delete window.ReactDOMServer;

  await loadScript('/react.development.js');
  await loadScript('/react-dom.development.js');
  await loadScript('/react-dom-server.browser.development.js');

  const React = (window.React16 = window.React);
  const ReactDOM = (window.ReactDOM16 = window.ReactDOM);
  window.ReactDOMServer16 = window.ReactDOMServer;

  const App = await import('./App');

  ReactDOM.render(
    React.createElement(App.default),
    document.getElementById('root')
  );
})();
