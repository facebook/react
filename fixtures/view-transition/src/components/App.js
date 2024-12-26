import React from 'react';

import Chrome from './Chrome';
import Page from './Page';

export default function App({assets}) {
  return (
    <Chrome title="Hello World" assets={assets}>
      <Page />
    </Chrome>
  );
}
