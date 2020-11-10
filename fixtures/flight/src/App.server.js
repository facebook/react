import * as React from 'react';

import Container from './Container';

import Counter from './Counter.client';

import ShowMore from './ShowMore.client';

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
