import * as React from 'react';
import {fetch} from 'react-fetch';

import Container from './Container.js';

import {Counter} from './Counter.client.js';
import {Counter as Counter2} from './Counter2.client.js';
import AddTodo from './AddTodo.client.js';
import DeleteTodo from './DeleteTodo.client.js';
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
          <React.Fragment key={todo.id}>
            <li>
              {todo.text} <DeleteTodo id={todo.id} />
            </li>
          </React.Fragment>
        ))}
      </ul>
      <AddTodo />
      <br />
      <br />
      <ShowMore>
        <p>Lorem ipsum</p>
      </ShowMore>
    </Container>
  );
}
