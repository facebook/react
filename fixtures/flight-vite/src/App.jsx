import * as React from 'react';
import Button from './Button.jsx';
import Form from './Form.jsx';
import {like, greet} from './actions.js';
import {getServerState} from './ServerState.js';
import {Counter} from './Counter2.jsx';
import './style.css';
import {cache, useState} from 'react';

const REACT_REFRESH_PREAMBLE = `
  import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
`;

async function Assets() {
  const styles = await __vite_find_assets__(['src/App.jsx']);
  return (
    <>
      {styles.map(key => (
        <link key={key} rel="stylesheet" href={key} />
      ))}
    </>
  );
}

const data = cache(async () => {
  return {foo: 'bar'};
});

export default async function App() {
  const res = await fetch('http://localhost:3001/todos');
  const todos = await res.json();
  const cachedData = await data();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Flight</title>
        {import.meta.env.DEV ? (
          <>
            <script type="module" src="@vite/client" />
            <script
              type="module"
              dangerouslySetInnerHTML={{
                __html: REACT_REFRESH_PREAMBLE,
              }}
            />
          </>
        ) : null}
        <Assets />
      </head>
      <body>
        <div>
          <h1>{getServerState()}</h1>
          <ul>
            {todos.map(todo => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
          <Form action={greet} />
          <div>
            <Button action={like}>Like</Button>
          </div>
          <Counter />
          <pre>{JSON.stringify(cachedData)}</pre>
        </div>
      </body>
    </html>
  );
}
