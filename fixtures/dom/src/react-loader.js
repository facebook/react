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

export default function loadReact() {
  let REACT_PATH = 'react.development.js';
  let DOM_PATH = 'react-dom.development.js';

  let query = parseQuery(window.location.search);
  let version = query.version || 'local';

  if (version !== 'local') {
    const {major, minor, prerelease} = semver(version);
    const [preReleaseStage] = prerelease;
    // The file structure was updated in 16. This wasn't the case for alphas.
    // Load the old module location for anything less than 16 RC
    if (major >= 16 && !(minor === 0 && preReleaseStage === 'alpha')) {
      REACT_PATH =
        'https://unpkg.com/react@' + version + '/umd/react.development.js';
      DOM_PATH =
        'https://unpkg.com/react-dom@' +
        version +
        '/umd/react-dom.development.js';
    } else {
      REACT_PATH = 'https://unpkg.com/react@' + version + '/dist/react.js';
      DOM_PATH =
        'https://unpkg.com/react-dom@' + version + '/dist/react-dom.js';
    }
  }

  const needsReactDOM = version === 'local' || parseFloat(version, 10) > 0.13;

  let request = loadScript(REACT_PATH);

  if (needsReactDOM) {
    request = request.then(() => loadScript(DOM_PATH));
  } else {
    // Aliasing React to ReactDOM for compatibility.
    request = request.then(() => {
      window.ReactDOM = window.React;
    });
  }

  return request;
}
