'use client';

import * as React from 'react';

export default function Deduped({children, thing}) {
  console.log({thing});
  return <div>{children}</div>;
}
