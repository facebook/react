import * as React from 'react';

import Container from './Container.js';
import {RefreshContext} from './Context.client';

export default function AddTodo() {
  const [text, setText] = React.useState('');
  const [startTransition, isPending] = React.unstable_useTransition();
  const refresh = React.useContext(RefreshContext);
  return (
    <Container>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button
        onClick={async () => {
          await fetch('http://localhost:3001/todos', {
            method: 'POST',
            mode: 'cors',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({text}),
          });
          startTransition(() => {
            refresh();
          });
        }}>
        add
      </button>
      {isPending && ' ...'}
    </Container>
  );
}
