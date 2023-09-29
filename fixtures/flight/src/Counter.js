'use client';

import * as React from 'react';
import {experimental_useFormState as useFormState} from 'react-dom';

import Container from './Container.js';

export function Counter({incrementAction}) {
  const [count, incrementFormAction] = useFormState(incrementAction, 0);
  return (
    <Container>
      <form>
        <button formAction={incrementFormAction}>Count: {count}</button>
      </form>
    </Container>
  );
}
