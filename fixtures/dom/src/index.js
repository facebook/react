import './polyfills';
import loadReact from './react-loader';

loadReact()
  .then(() => import('./components/App'))
  .then(App => {
    const {React, ReactDOM} = window;

    if (typeof window.ReactDOMClient !== 'undefined') {
      // we are in a React that only supports modern roots

      ReactDOM.createRoot(document.getElementById('root')).render(
        React.createElement(App.default)
      );
    } else {
      ReactDOM.render(
        React.createElement(App.default),
        document.getElementById('root')
      );
    }
  });
