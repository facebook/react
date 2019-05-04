import React, {useContext, useState, Suspense} from 'react';

import Chrome from './Chrome';
import Page from './Page';
import Page2 from './Page2';
import Theme from './Theme';

import Input from './fixtures/input';
import Select from './fixtures/select';
import Textarea from './fixtures/textarea';

function LoadingIndicator() {
  let theme = useContext(Theme);
  return <div className={theme + '-loading'}>Loading...</div>;
}

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
        <Suspense fallback={<LoadingIndicator />}>
          <CurrentPage />
        </Suspense>
      </div>
      
      <Input />
      <Select />
      <Textarea />
    </Chrome>
  );
}
