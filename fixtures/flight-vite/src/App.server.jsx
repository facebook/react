import * as React from 'react';
import {fetch} from 'react-fetch';

import Container from './Container';

import {Counter} from './Counter.client';
import {Counter as Counter2} from './Counter2.client';

import ShowMore from './ShowMore.client';

export default function App() {
  const todos = fetch('http://localhost:3000/todos').json();
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
