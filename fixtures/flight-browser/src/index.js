import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import ReactFlightDOMServer from 'react-dom/unstable-flight-server';
import ReactFlightDOMClient from 'react-dom/unstable-flight-client';

function Text({children}) {
  return <span>{children}</span>;
}
function HTML() {
  return (
    <div>
      <Text>hello</Text>
      <Text>world</Text>
    </div>
  );
}

let resolved = false;
let promise = new Promise(resolve => {
  setTimeout(() => {
    resolved = true;
    resolve();
  }, 100);
});
function read() {
  if (!resolved) {
    throw promise;
  }
}

function Title() {
  read();
  return 'Title';
}

let model = {
  title: <Title />,
  content: {
    __html: <HTML />,
  },
};

let stream = ReactFlightDOMServer.renderToReadableStream(model);
let response = new Response(stream, {
  headers: {'Content-Type': 'text/html'},
});
display(response);

async function display(responseToDisplay) {
  let blob = await responseToDisplay.blob();
  let url = URL.createObjectURL(blob);

  let data = ReactFlightDOMClient.readFromFetch(fetch(url));
  // The client also supports XHR streaming.
  // var xhr = new XMLHttpRequest();
  // xhr.open('GET', url);
  // let data = ReactFlightDOMClient.readFromXHR(xhr);
  // xhr.send();

  renderResult(data);
}

function Shell({data}) {
  let model = data.model;
  return (
    <div>
      <Suspense fallback="...">
        <h1>{model.title}</h1>
      </Suspense>
      <div dangerouslySetInnerHTML={model.content} />
    </div>
  );
}

function renderResult(data) {
  const container = document.getElementById('root');
  ReactDOM.render(
    <Suspense fallback="Loading...">
      <Shell data={data} />
    </Suspense>,
    container
  );
}
