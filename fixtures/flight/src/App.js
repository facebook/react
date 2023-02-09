import * as React from 'react';

import Container from './Container.js';

import {Counter} from './Counter.js';
import {Counter as Counter2} from './Counter2.js';

import ShowMore from './ShowMore.js';

export default async function App() {
  const res = await fetch('http://localhost:3001/todos');
  const todos = await res.json();
  return (
    <Container>
      <h1>Hello, world</h1>
      <Counter />
      <Counter2 />
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <ShowMore>
        <p>Lorem ipsum</p>
      </ShowMore>
    </Container>
  );
}
