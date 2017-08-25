import {loadScript} from './react-loader';
import './index.css';

(async function foo() {
  await loadScript('https://unpkg.com/react@15.6.1/dist/react.js');
  await loadScript('https://unpkg.com/react-dom@15.6.1/dist/react-dom.js');
  window.React15 = window.React;
  window.ReactDOM15 = window.ReactDOM;
  delete window.React;
  delete window.ReactDOM;

  await loadScript('/react.development.js');
  await loadScript('/react-dom.development.js');

  const React = (window.React16 = window.React);
  const ReactDOM = (window.ReactDOM16 = window.ReactDOM);

  const App = await import('./App');

  ReactDOM.render(
    React.createElement(App.default),
    document.getElementById('root')
  );
})();
