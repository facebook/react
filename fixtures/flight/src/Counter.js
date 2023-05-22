'use client';

import * as React from 'react';

import Container from './Container.js';

export function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <Container>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </Container>
  );
}
