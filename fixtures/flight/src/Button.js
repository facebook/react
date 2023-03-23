'use client';

import * as React from 'react';

export default function Button({action, children}) {
  const [isPending, setIsPending] = React.useState(false);

  return (
    <button
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        try {
          const result = await action();
          console.log(result);
        } catch (error) {
          console.error(error);
        } finally {
          setIsPending(false);
        }
      }}>
      {children}
    </button>
  );
}
