'use client';

import * as React from 'react';

import ErrorBoundary from './ErrorBoundary.jsx';
import {useFormStatus} from 'react-dom';

function ButtonDisabledWhilePending({action, children}) {
  const {pending} = useFormStatus();
  return (
    <button disabled={pending} formAction={action}>
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
