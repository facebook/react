import React, {useState} from 'react';

import Chrome from './Chrome';
import Page from './Page';
import Page2 from './Page2';
import CreatePortal from './CreatePortal';

export default function App({assets}) {
  let [CurrentPage, switchPage] = useState(() => Page);
  return (
    <Chrome title="Hello World" assets={assets}>
      <div>
        <h1>Hello World</h1>
        <a className="link" onClick={() => switchPage(() => Page)}>
          Page 1
        </a>
        {' | '}
        <a className="link" onClick={() => switchPage(() => Page2)}>
          Page 2
        </a>
        <CurrentPage />
        <CreatePortal />
      </div>
    </Chrome>
  );
}
