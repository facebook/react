'use client';

import * as React from 'react';

export function TemporaryReferences({action}) {
  const [result, formAction] = React.useActionState(action, null);

  return (
    <form action={formAction} data-testid="form">
      <button>Return element from action</button>
      {result}
    </form>
  );
}
