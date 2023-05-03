'use client';

import * as React from 'react';
import {experimental_useFormStatus as useFormStatus} from 'react-dom';
import ErrorBoundary from './ErrorBoundary.js';

function ButtonDisabledWhilePending({action, children}) {
  const {pending} = useFormStatus();
  return (
    <button
      disabled={pending}
      formAction={async () => {
        const result = await action();
        console.log(result);
      }}>
      {children}
    </button>
  );
}

export default function Button({action, children}) {
  return (
    <ErrorBoundary>
      <form>
        <ButtonDisabledWhilePending action={action}>
          {children}
        </ButtonDisabledWhilePending>
      </form>
    </ErrorBoundary>
  );
}
