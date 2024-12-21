import * as React from 'react';
import {use, Suspense, useState, startTransition} from 'react';
import ReactDOM from 'react-dom/client';
import {createFromFetch, encodeReply} from 'react-server-dom-webpack/client';

// TODO: This should be a dependency of the App but we haven't implemented CSS in Node yet.
import './style.css';

function findSourceMapURL(fileName) {
  return (
    document.location.origin +
    '/source-maps?name=' +
    encodeURIComponent(fileName)
  );
}

let updateRoot;
async function callServer(id, args) {
  const response = fetch('/', {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'rsc-action': id,
    },
    body: await encodeReply(args),
  });
  const {returnValue, root} = await createFromFetch(response, {
    callServer,
    findSourceMapURL,
  });
  // Refresh the tree with the new RSC payload.
  startTransition(() => {
    updateRoot(root);
  });
  return returnValue;
}

function Shell({data}) {
  const [root, setRoot] = useState(data);
  updateRoot = setRoot;
  return root;
}

async function hydrateApp() {
  const {root, returnValue, formState} = await createFromFetch(
    fetch('/', {
      headers: {
        Accept: 'text/x-component',
      },
    }),
    {
      callServer,
      findSourceMapURL,
    }
  );

  ReactDOM.hydrateRoot(document, <Shell data={root} />, {
    // TODO: This part doesn't actually work because the server only returns
    // form state during the request that submitted the form. Which means it
    // the state needs to be transported as part of the HTML stream. We intend
    // to add a feature to Fizz for this, but for now it's up to the
    // metaframework to implement correctly.
    formState: formState,
  });
}

// Remove this line to simulate MPA behavior
hydrateApp();
