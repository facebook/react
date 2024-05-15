import React, {useContext, useState, Suspense} from 'react';

import Chrome from './Chrome';
import Page from './Page';
import Page2 from './Page2';
import Theme from './Theme';

function LoadingIndicator() {
  let theme = useContext(Theme);
  return <div className={theme + '-loading'}>Loading...</div>;
}

function Content() {
  let [CurrentPage, switchPage] = useState(() => Page);
  return (
    <div>
      <h1>Hello World</h1>
      <a className="link" onClick={() => switchPage(() => Page)}>
        Page 1
      </a>
      {' | '}
      <a className="link" onClick={() => switchPage(() => Page2)}>
        Page 2
      </a>
      <Suspense fallback={<LoadingIndicator />}>
        <CurrentPage />
      </Suspense>
    </div>
  );
}

export default function App({assets}) {
  return (
    <Chrome title="Hello World" assets={assets}>
      <Content />
    </Chrome>
  );
}
