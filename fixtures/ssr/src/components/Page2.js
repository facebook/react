import React, {useContext} from 'react';

import Theme from './Theme';
import Suspend from './Suspend';

import './Page.css';

export default function Page2() {
  let theme = useContext(Theme);
  return (
    <div className={theme + '-box'}>
      <Suspend>Content of a different page</Suspend>
    </div>
  );
}
