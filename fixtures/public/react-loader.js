/**
 * Take a version from the window query string and load a specific
 * version of React.
 *
 * @example
 * http://localhost:3000?version=15.4.1
 * (Loads React 15.4.1)
 */

var REACT_PATH = 'react.js';
var DOM_PATH = 'react-dom.js';
var BABEL_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.19.0/babel.js';

function parseQuery(qstr) {
  var query = {};

  var a = qstr.substr(1).split('&');

  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');

    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }

  return query;
}

var query = parseQuery(window.location.search);
var version = query.version || 'local';

console.log(query)

if (version !== 'local') {
  REACT_PATH = 'https://unpkg.com/react@' + version + '/dist/react.min.js';
  DOM_PATH = 'https://unpkg.com/react-dom@' + version + '/dist/react-dom.min.js';
}

console.log('Loading ' + version);

document.write('<script src="' + BABEL_PATH + '"></script>');
document.write('<script src="' + REACT_PATH + '"></script>');

// Versions earlier than 14 do not use ReactDOM
if (version === 'local' || parseFloat(version, 10) > 0.13) {
  document.write('<script src="' + DOM_PATH + '"></script>');
} else {
  console.log('Aliasing React to ReactDOM for compatability.');
  document.write('<script>ReactDOM = React</script>');
}
