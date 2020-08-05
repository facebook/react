import React from 'react';
import {useContext} from 'react';
import {findDOMNode} from 'react-dom';

import ThemeContext from './shared/ThemeContext';
import lazyLegacyRoot from './lazyLegacyRoot';

// Lazy-load a component from the bundle using legacy React.
const Greeting = lazyLegacyRoot(() => import('../legacy/Greeting'));

export default function AboutPage() {
  findDOMNode();
  const theme = useContext(ThemeContext);
  return (
    <>
      <h2>src/modern/AboutPage.js</h2>
      <h3 style={{color: theme}}>
        This component is rendered by the outer React.
      </h3>
      <Greeting />
    </>
  );
}
