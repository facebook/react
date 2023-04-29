'use client';

import * as React from 'react';
import {flushSync} from 'react-dom';
import ErrorBoundary from './ErrorBoundary.js';

export default function Button({action, children}) {
  const [isPending, setIsPending] = React.useState(false);

  return (
    <ErrorBoundary>
      <form>
        <button
          disabled={isPending}
          formAction={async () => {
            // TODO: Migrate to useFormPending once that exists
            flushSync(() => setIsPending(true));
            try {
              const result = await action();
              console.log(result);
            } finally {
              React.startTransition(() => setIsPending(false));
            }
          }}>
          {children}
        </button>
      </form>
    </ErrorBoundary>
  );
}
