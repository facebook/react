'use client';

import * as React from 'react';
import {flushSync} from 'react-dom';
import ErrorBoundary from './ErrorBoundary.js';

export default function Form({action, children}) {
  const [isPending, setIsPending] = React.useState(false);

  return (
    <ErrorBoundary>
      <form
        action={async formData => {
          // TODO: Migrate to useFormPending once that exists
          flushSync(() => setIsPending(true));
          try {
            const result = await action(formData);
            alert(result);
          } finally {
            React.startTransition(() => setIsPending(false));
          }
        }}>
        <input name="name" />
        <button>Say Hi</button>
      </form>
    </ErrorBoundary>
  );
}
