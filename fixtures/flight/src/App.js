import * as React from 'react';
import {renderToPipeableStream} from 'react-server-dom-webpack/server';
import {createFromNodeStream} from 'react-server-dom-webpack/client';
import {PassThrough, Readable} from 'stream';

import Container from './Container.js';

import {Counter} from './Counter.js';
import {Counter as Counter2} from './Counter2.js';
import AsyncModule from './cjs/Counter3.js';
const Counter3 = await(AsyncModule);

import ShowMore from './ShowMore.js';
import Button from './Button.js';
import Form from './Form.js';
import {Dynamic} from './Dynamic.js';
import {Client} from './Client.js';
import {Navigate} from './Navigate.js';

import {Note} from './cjs/Note.js';

import {GenerateImage} from './GenerateImage.js';

import {like, greet, increment} from './actions.js';

import {getServerState} from './ServerState.js';

const promisedText = new Promise(resolve =>
  setTimeout(() => resolve('deferred text'), 50)
);

function Foo({children}) {
  return <div>{children}</div>;
}

async function delay(text, ms) {
  return new Promise(resolve => setTimeout(() => resolve(text), ms));
}

async function Bar({children}) {
  await delay('deferred text', 10);
  return <div>{children}</div>;
}

async function ThirdPartyComponent() {
  return delay('hello from a 3rd party', 30);
}

// Using Web streams for tee'ing convenience here.
let cachedThirdPartyReadableWeb;

// We create the Component outside of AsyncLocalStorage so that it has no owner.
// That way it gets the owner from the call to createFromNodeStream.
const thirdPartyComponent = <ThirdPartyComponent />;

function fetchThirdParty(noCache) {
  if (cachedThirdPartyReadableWeb && !noCache) {
    const [readableWeb1, readableWeb2] = cachedThirdPartyReadableWeb.tee();
    cachedThirdPartyReadableWeb = readableWeb1;

    return createFromNodeStream(Readable.fromWeb(readableWeb2), {
      moduleMap: {},
      moduleLoading: {},
    });
  }

  const stream = renderToPipeableStream(
    thirdPartyComponent,
    {},
    {environmentName: 'third-party'}
  );

  const readable = new PassThrough();
  // React currently only supports piping to one stream, so we convert, tee, and
  // convert back again.
  // TODO: Switch to web streams without converting when #33442 has landed.
  const [readableWeb1, readableWeb2] = Readable.toWeb(readable).tee();
  cachedThirdPartyReadableWeb = readableWeb1;
  const result = createFromNodeStream(Readable.fromWeb(readableWeb2), {
    moduleMap: {},
    moduleLoading: {},
  });
  stream.pipe(readable);

  return result;
}

async function ServerComponent({noCache}) {
  await delay('deferred text', 50);
  return await fetchThirdParty(noCache);
}

export default async function App({prerender, noCache}) {
  const res = await fetch('http://localhost:3001/todos');
  const todos = await res.json();

  const dedupedChild = <ServerComponent noCache={noCache} />;
  const message = getServerState();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Flight</title>
      </head>
      <body>
        <Container>
          {prerender ? (
            <meta data-testid="prerendered" name="prerendered" content="true" />
          ) : (
            <meta content="when not prerendering we render this meta tag. When prerendering you will expect to see this tag and the one with data-testid=prerendered because we SSR one and hydrate the other" />
          )}
          <h1>{message}</h1>
          <React.Suspense fallback={null}>
            <div data-testid="promise-as-a-child-test">
              Promise as a child hydrates without errors: {promisedText}
            </div>
          </React.Suspense>
          <Counter incrementAction={increment} />
          <Counter2 incrementAction={increment} />
          <Counter3 incrementAction={increment} />
          <ul>
            {todos.map(todo => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
          <ShowMore>
            <p>Lorem ipsum</p>
          </ShowMore>
          <Form action={greet} />
          <div>
            <Button action={like}>Like</Button>
          </div>
          <div>
            loaded statically: <Dynamic />
          </div>
          <div>
            <GenerateImage message={message} />
          </div>
          <Client />
          <Note />
          <Foo>{dedupedChild}</Foo>
          <Bar>{Promise.resolve([dedupedChild])}</Bar>
          <Navigate />
        </Container>
      </body>
    </html>
  );
}
