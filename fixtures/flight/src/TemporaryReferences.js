'use client';

import * as React from 'react';

export function TemporaryReferences({action}) {
  const [result, formAction] = React.useActionState(action, null);

  return (
    <form action={formAction}>
      <button>Return element from action</button>
      <div data-testid="temporary-references-action-result">{result}</div>
    </form>
  );
}
