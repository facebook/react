import React from 'react';
import {useContext} from 'react';
import {Link} from 'react-router-dom';

import ThemeContext from './shared/ThemeContext';
import Clock from './shared/Clock';

export default function HomePage() {
  const theme = useContext(ThemeContext);
  return (
    <>
      <h2>src/modern/HomePage.js</h2>
      <h3 style={{color: theme}}>
        This component is rendered by the outer React.
      </h3>
      <Clock />
      <b>
        <Link to="/about">Go to About</Link>
      </b>
    </>
  );
}
