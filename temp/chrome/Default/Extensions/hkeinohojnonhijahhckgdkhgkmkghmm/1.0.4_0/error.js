(() => {
  let url = new URL(document.location.toString()).searchParams.get('url');
  if (!url) {
    console.warn("No 'url' query param provided!");
    return;
  }

  let urlElement = document.getElementById('url');
  urlElement.href = url;
  urlElement.innerText = url;

  let statusDiv = document.getElementById('status');
  let responseBlock = document.getElementById('response');
  statusDiv.innerText = 'Running diagnostics...';
  let req = new Request('http://www.edge.x2p.facebook.net/', {
    method: 'HEAD',
    headers: {
      'x-fb-x2dev-targethost': new URL(url).hostname,
      'x-fb-x2dev-destport': '10443',
    },
  });
  fetch(req).then(
    (res) => {
      const authorizationUrlHeader = res.headers.get(
        'x-fb-x2dev-authorization-url',
      );
      if (authorizationUrlHeader !== null) {
        window.location.href = authorizationUrlHeader;
      } else {
        statusDiv.innerText = formatDiagnosis(res);
        responseBlock.innerText = formatResponse(res);
      }
    },
    (err) => {
      statusDiv.innerText = 'Diagnostic also failed: ' + err.toString();
    },
  );

  function formatDiagnosis(response) {
    let text = '';
    if (response.status == 503) {
      text += 'Is the webserver or VM running?';
    } else {
      for (var header of response.headers.keys()) {
        if (header.toLowerCase().startsWith('x-fb-validated-x2pauth-advice')) {
          text += response.headers.get(header) + '\n';
        }
        if (header.toLowerCase() == 'x-fb-x2dev-error-msg') {
          text += response.headers.get(header) + '\n';
        }
      }
    }
    return text;
  }

  function formatResponse(response) {
    let text = `HTTP/1.1 ${response.status} ${response.statusText}\n`;
    for (var header of response.headers.keys()) {
      text += `${header}: ${response.headers.get(header)}\n`;
    }
    text += '\n';
    return text;
  }
})();
