import * as React from 'react';

import Container from './Container.js';

import Counter from './Counter.client.js';

import ShowMore from './ShowMore.client.js';

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
