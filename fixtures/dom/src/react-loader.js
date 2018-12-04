import semver from 'semver';

/**
 * Take a version from the window query string and load a specific
 * version of React.
 *
 * @example
 * http://localhost:3000?version=15.4.1
 * (Loads React 15.4.1)
 */

function parseQuery(qstr) {
  var query = {};
  var a = qstr.substr(1).split('&');

  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }
  return query;
}

function loadScript(src) {
  let firstScript = document.getElementsByTagName('script')[0];
  let scriptNode;

  return new Promise((resolve, reject) => {
    scriptNode = document.createElement('script');
    scriptNode.async = 1;
    scriptNode.src = src;

    scriptNode.onload = () => resolve();
    scriptNode.onerror = () => reject(new Error(`failed to load: ${src}`));

    firstScript.parentNode.insertBefore(scriptNode, firstScript);
  });
}

export function reactPaths() {
  let query = parseQuery(window.location.search);
  let version = query.version || 'local';
  let isProduction = query.production === 'true';

  let environment = isProduction ? 'production.min' : 'development';

  let reactPath = 'react.' + environment + '.js';
  let reactDOMPath = 'react-dom.' + environment + '.js';
  let reactDOMServerPath = 'react-dom-server.browser.' + environment + '.js';

  if (version !== 'local') {
    const {major, minor, prerelease} = semver(version);
    const [preReleaseStage] = prerelease;
    // The file structure was updated in 16. This wasn't the case for alphas.
    // Load the old module location for anything less than 16 RC
    if (major >= 16 && !(minor === 0 && preReleaseStage === 'alpha')) {
      reactPath =
        'https://unpkg.com/react@' +
        version +
        '/umd/react.' +
        environment +
        '.js';
      reactDOMPath =
        'https://unpkg.com/react-dom@' +
        version +
        '/umd/react-dom.' +
        environment +
        '.js';
      reactDOMServerPath =
        'https://unpkg.com/react-dom@' +
        version +
        '/umd/react-dom-server.browser.' +
        environment +
        '.js';
    } else {
      let suffix = isProduction ? '.min.js' : '.js';

      reactPath = 'https://unpkg.com/react@' + version + '/dist/react' + suffix;
      reactDOMPath =
        'https://unpkg.com/react-dom@' + version + '/dist/react-dom' + suffix;
      reactDOMServerPath =
        'https://unpkg.com/react-dom@' +
        version +
        '/dist/react-dom-server' +
        suffix;
    }
  }

  const needsReactDOM = version === 'local' || parseFloat(version, 10) > 0.13;

  return {reactPath, reactDOMPath, reactDOMServerPath, needsReactDOM};
}

export default function loadReact() {
  const {reactPath, reactDOMPath, needsReactDOM} = reactPaths();

  let request = loadScript(reactPath);

  if (needsReactDOM) {
    request = request.then(() => loadScript(reactDOMPath));
  } else {
    // Aliasing React to ReactDOM for compatibility.
    request = request.then(() => {
      window.ReactDOM = window.React;
    });
  }

  return request;
}
