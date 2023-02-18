'use client';

import * as React from 'react';

export default function Button({action, children}) {
  return (
    <button
      onClick={async () => {
        const result = await action();
        console.log(result);
      }}>
      {children}
    </button>
  );
}
