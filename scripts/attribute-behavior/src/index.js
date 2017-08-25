import {loadScript} from './react-loader';

(async function foo() {
  await loadScript('https://unpkg.com/react@15.6.1/dist/react.min.js');
  await loadScript('https://unpkg.com/react-dom@15.6.1/dist/react-dom.min.js');
  window.React15 = window.React;
  window.ReactDOM15 = window.ReactDOM;
  delete window.React;
  delete window.ReactDOM;

  await loadScript('/react.production.min.js');
  await loadScript('/react-dom.production.min.js');

  const React = (window.React16 = window.React);
  const ReactDOM = (window.ReactDOM16 = window.ReactDOM);

  const App = await import('./App');

  ReactDOM.render(
    React.createElement(App.default),
    document.getElementById('root')
  );
})();
