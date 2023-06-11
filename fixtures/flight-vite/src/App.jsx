import * as React from 'react';
import Button from './Button.jsx';
import Form from './Form.jsx';
import {like, greet} from './actions.js';
import {getServerState} from './ServerState.js';
import {Counter} from './Counter2.jsx';
import './style.css';

const REACT_REFRESH_PREAMBLE = `
  import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
`;

export default async function App() {
  const res = await fetch('http://localhost:3001/todos');
  const todos = await res.json();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Flight</title>
        <link rel="stylesheet" href="/src/style.css" />
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
        </div>
      </body>
    </html>
  );
}
