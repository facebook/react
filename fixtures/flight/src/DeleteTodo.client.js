import * as React from 'react';
import useMutation from './useMutation.client';

export default function DeleteTodo({id}) {
  const [deleteTodo] = useMutation(async () => {
    await fetch('http://localhost:3001/todos/' + id, {
      method: 'DELETE',
      mode: 'cors',
    });
  });
  return <button onClick={() => deleteTodo()}>x</button>;
}
