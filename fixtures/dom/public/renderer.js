/**
 * Supports render.html, a piece of the hydration fixture. See /hydration
 */

'use strict';

(function() {
  var output = document.getElementById('output');
  var status = document.getElementById('status');
  var hydrate = document.getElementById('hydrate');
  var reload = document.getElementById('reload');
  var renders = 0;
  var failed = false;

  function query(key) {
    var pattern = new RegExp(key + '=([^&]+)(&|$)');
    var matches = window.location.search.match(pattern);

    if (matches) {
      return decodeURIComponent(matches[1]);
    }

    handleError(new Error('No key found for' + key));
  }

  function booleanQuery(key) {
    return query(key) === 'true';
  }

  function setStatus(label) {
    status.innerHTML = label;
  }

  function prerender() {
    setStatus('Generating markup');

    output.innerHTML = ReactDOMServer.renderToString(
      React.createElement(Fixture)
    );

    setStatus('Markup only (No React)');
  }

  function render() {
    setStatus('Hydrating');

    if (ReactDOM.hydrate) {
      ReactDOM.hydrate(React.createElement(Fixture), output);
    } else {
      ReactDOM.render(React.createElement(Fixture), output);
    }

    setStatus(renders > 0 ? 'Re-rendered (' + renders + 'x)' : 'Hydrated');
    renders += 1;
    hydrate.innerHTML = 'Re-render';
  }

  function handleError(error) {
    console.log(error);
    failed = true;
    setStatus('Javascript Error');
    output.innerHTML = error;
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.async = true;
      script.src = src;

      script.onload = resolve;
      script.onerror = function(error) {
        reject(new Error('Unable to load ' + src));
      };

      document.body.appendChild(script);
    });
  }

  function injectFixture(src) {
    var script = document.createElement('script');
    script.textContent = src;
    document.body.appendChild(script);

    if (typeof Fixture === 'undefined') {
      setStatus('Failed');
      output.innerHTML = 'Please name your root component "Fixture"';
    } else {
      prerender();

      if (booleanQuery('hydrate')) {
        render();
      }
    }
  }

  function reloadFixture(code) {
    renders = 0;
    ReactDOM.unmountComponentAtNode(output);
    injectFixture(code);
  }

  window.onerror = handleError;

  reload.onclick = function() {
    window.location.reload();
  };

  hydrate.onclick = render;

  loadScript(query('reactPath'))
    .then(function() {
      return booleanQuery('needsReactDOM')
        ? loadScript(query('reactDOMPath'))
        : null;
    })
    .then(function() {
      return loadScript(query('reactDOMServerPath'));
    })
    .then(function() {
      if (failed) {
        return;
      }

      window.addEventListener('message', function(event) {
        switch (event.data.type) {
          case 'code':
            reloadFixture(event.data.payload);
            break;
          default:
            throw new Error('Unrecognized message: ' + event.data.type);
        }
      });

      window.parent.postMessage({type: 'ready'}, '*');
    })
    .catch(handleError);
})();
