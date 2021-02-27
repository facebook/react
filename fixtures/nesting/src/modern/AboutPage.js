import React from 'react';
import {useContext} from 'react';
import {connect} from 'react-redux';

import ThemeContext from './shared/ThemeContext';
import lazyLegacyRoot from './lazyLegacyRoot';

// Lazy-load a component from the bundle using legacy React.
const Greeting = lazyLegacyRoot(() => import('../legacy/Greeting'));

function AboutPage({counter, dispatch}) {
  const theme = useContext(ThemeContext);
  return (
    <>
      <h2>src/modern/AboutPage.js</h2>
      <h3 style={{color: theme}}>
        This component is rendered by the outer React ({React.version}).
      </h3>
      <Greeting />
      <br />
      <p>
        Counter: {counter}{' '}
        <button onClick={() => dispatch({type: 'increment'})}>+</button>
      </p>
    </>
  );
}

function mapStateToProps(state) {
  return {counter: state};
}

export default connect(mapStateToProps)(AboutPage);
