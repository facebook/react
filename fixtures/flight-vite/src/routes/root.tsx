import React from 'react';
import {
  changeServerCounter,
  resetServerCounter,
  getServerCounter,
} from './action';
import {ClientCounter, Hydrated} from './client';
import {
  TestActionFromClient,
  TestTemporaryReference,
  TestUseActionState,
} from './action-from-client/client';

export function Root(props: {url: URL}) {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body>
        <h4>Test</h4>
        <div>
          <Hydrated />
        </div>
        <div className="test-style">test-style</div>
        <div>
          <a href="./suspense">test-suspense</a>{' '}
          {props.url.pathname === '/suspense' && <TestSuspense />}
        </div>
        <div>
          <a href="./console-replay">test-console-replay</a>{' '}
          {props.url.pathname === '/console-replay' && <TestConsoleReplay />}
        </div>
        <ClientCounter />
        <ServerCounter />
        <TestActionFromClient />
        <TestUseActionState />
        <TestTemporaryReference />
      </body>
    </html>
  );
}

function ServerCounter() {
  return (
    <form action={changeServerCounter.bind(null, 1)}>
      <button>Server Counter: {getServerCounter()}</button>
      <button formAction={resetServerCounter}>Server Reset</button>
    </form>
  );
}

function TestConsoleReplay() {
  console.log('[test-console-replay]');
  return <div></div>;
}

function TestSuspense() {
  async function Sleep() {
    await new Promise(r => setTimeout(r, 1000));
    return <span>suspense-resolved</span>;
  }
  return (
    <span data-testid="suspense">
      <React.Suspense fallback={<span>suspense-fallback</span>}>
        <Sleep />
      </React.Suspense>
    </span>
  );
}
