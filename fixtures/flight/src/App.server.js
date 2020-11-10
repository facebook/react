import * as React from 'react';

import Container from './Container';

// TODO: A transform should read this from webpack plugin output.
const Counter = {
  $$typeof: Symbol.for('react.module.reference'),
  name: './src/Counter.client.js',
};

const ShowMore = {
  $$typeof: Symbol.for('react.module.reference'),
  name: './src/ShowMore.client.js',
};

export default function App() {
  return (
    <Container>
      <h1>Hello, world</h1>
      <Counter />
      <ShowMore>
        <p>Lorem ipsum</p>
      </ShowMore>
    </Container>
  );
}
