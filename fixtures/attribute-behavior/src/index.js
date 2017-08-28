import {loadScript} from './react-loader';
import './index.css';

(async function foo() {
  await loadScript('/15/react.js');
  await loadScript('/15/react-dom.js');
  window.React15 = window.React;
  window.ReactDOM15 = window.ReactDOM;
  delete window.React;
  delete window.ReactDOM;

  await loadScript('/16-pre/react.development.js');
  await loadScript('/16-pre/react-dom.development.js');

  const React = (window.React16 = window.React);
  const ReactDOM = (window.ReactDOM16 = window.ReactDOM);

  const App = await import('./App');

  ReactDOM.render(
    React.createElement(App.default),
    document.getElementById('root')
  );
})();
