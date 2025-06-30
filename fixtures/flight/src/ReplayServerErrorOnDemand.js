'use client';

import * as React from 'react';

export function ReplayServerErrorOnDemand({action}) {
  const [children, formAction] = React.useActionState(action, null);
  return (
    <form>
      <button formAction={formAction}>Trigger</button>
      {children}
    </form>
  );
}
