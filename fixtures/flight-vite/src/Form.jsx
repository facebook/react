'use client';

import * as React from 'react';

import ErrorBoundary from './ErrorBoundary.jsx';
import {useFormStatus} from 'react-dom';

function Status() {
  const {pending} = useFormStatus();
  return pending ? 'Saving...' : null;
}

export default function Form({action, children}) {
  const [isPending, setIsPending] = React.useState(false);
  return (
    <ErrorBoundary>
      <form action={action}>
        <label>
          Name: <input name="name" />
        </label>
        <label>
          File: <input type="file" name="file" />
        </label>
        <button>Say Hi</button>
        <Status />
      </form>
    </ErrorBoundary>
  );
}
