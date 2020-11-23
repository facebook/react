import * as React from 'react';

import Container from './Container.js';
import useMutation from './useMutation.client';

export default function AddTodo() {
  const [text, setText] = React.useState('');
  const [postTodo, isPosting] = useMutation(async () => {
    setText('');
    await fetch('http://localhost:3001/todos', {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({text}),
    });
  });
  return (
    <Container>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => postTodo()}>add</button>
      {isPosting && ' ...'}
    </Container>
  );
}
