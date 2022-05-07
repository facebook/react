import * as React from 'react';
import {fetch} from 'react-fetch';

import Container from './Container.js';

import {Counter} from './Counter.client.js';
import {Counter as Counter2} from './Counter2.client.js';

import ShowMore from './ShowMore.client.js';

export default function App() {
  const todos = fetch('http://localhost:3001/todos').json();
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
